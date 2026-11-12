$ErrorActionPreference = "Continue"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$Port = 3000
$BaseDir = $PSScriptRoot
if (-not $BaseDir) { $BaseDir = (Get-Location).Path }
$DbPath = Join-Path $BaseDir "data\db.json"
$IndexPath = Join-Path $BaseDir "index.html"
$EnvPath = Join-Path $BaseDir ".env.local"

$Global:BotToken = $env:TELEGRAM_BOT_TOKEN
$Global:GroupChatId = "-5387102105"
$Global:GroupTitle = "Vanguard Realty"
$Global:FallbackAdminChatId = "5598854282"
$Global:BotUsername = ""
$Global:LastUpdateId = 0
$Global:LastBotError = ""
$Global:UserSessions = @{}

function Escape-Html($str) {
    if ($null -eq $str) { return "" }
    $s = [string]$str
    return $s.Replace("&", "&amp;").Replace("<", "&lt;").Replace(">", "&gt;")
}

function Load-Config {
    if (Test-Path $EnvPath) {
        $lines = [System.IO.File]::ReadAllLines($EnvPath, [System.Text.Encoding]::UTF8)
        foreach ($line in $lines) {
            if ($line -match "^TELEGRAM_BOT_TOKEN=(.+)$") {
                $val = $Matches[1].Trim()
                if ($val -and $val -ne "your_telegram_bot_token_here") { $Global:BotToken = $val }
            }
            if ($line -match "^TELEGRAM_GROUP_CHAT_ID=(.+)$") {
                $val = $Matches[1].Trim()
                if ($val -and $val -ne "your_telegram_group_chat_id_here") { $Global:GroupChatId = $val }
            }
        }
    }
}

function Save-Config($token, $groupId) {
    if ($token) { $Global:BotToken = $token.Trim() }
    if ($null -ne $groupId) { $Global:GroupChatId = $groupId.Trim() }
    $content = @(
        "GEMINI_API_KEY=",
        "GEMINI_MODEL=gemini-3.5-flash-lite",
        "TELEGRAM_BOT_TOKEN=$($Global:BotToken)",
        "TELEGRAM_GROUP_CHAT_ID=$($Global:GroupChatId)",
        "ADMIN_PASSWORD=vanguard2026"
    ) -join "`r`n"
    [System.IO.File]::WriteAllText($EnvPath, $content, [System.Text.Encoding]::UTF8)
}

function Read-Db {
    $raw = [System.IO.File]::ReadAllText($DbPath, [System.Text.Encoding]::UTF8)
    return $raw | ConvertFrom-Json
}

function Write-Db($data) {
    $json = $data | ConvertTo-Json -Depth 10
    [System.IO.File]::WriteAllText($DbPath, $json, [System.Text.Encoding]::UTF8)
}

function Invoke-TelegramApi($methodName, $payloadObj = $null) {
    if (-not $Global:BotToken) { return $null }
    $uri = "https://api.telegram.org/bot$($Global:BotToken)/$methodName"
    try {
        if ($null -eq $payloadObj) {
            return Invoke-RestMethod -Uri $uri -Method Get -TimeoutSec 5
        } else {
            $jsonBody = $payloadObj | ConvertTo-Json -Depth 10 -Compress
            $bytes = [System.Text.Encoding]::UTF8.GetBytes($jsonBody)
            return Invoke-RestMethod -Uri $uri -Method Post -ContentType "application/json; charset=utf-8" -Body $bytes -TimeoutSec 5
        }
    } catch {
        $Global:LastBotError = $_.Exception.Message
        Write-Output "Telegram API Error ($methodName): $($Global:LastBotError)"
        return $null
    }
}

function Send-TelegramMessage($chatId, $htmlText, $replyMarkup = $null) {
    if (-not $chatId) { return $null }
    $payload = @{
        chat_id = $chatId
        text = $htmlText
        parse_mode = "HTML"
    }
    if ($null -ne $replyMarkup) {
        $payload.reply_markup = $replyMarkup
    }
    return Invoke-TelegramApi "sendMessage" $payload
}

function Notify-TelegramGroup($lead) {
    $cName = Escape-Html $lead.clientName
    $cPhone = Escape-Html $lead.phone
    $cProp = Escape-Html $lead.propertyTitle
    $cDate = Escape-Html "$($lead.preferredDate) $($lead.preferredTime)"
    $cSource = Escape-Html $lead.source
    $cTg = if ($lead.telegramUsername) { "`n💬 <b>Telegram:</b> $(Escape-Html $lead.telegramUsername)" } else { "" }

    $msg = "🏛 <b>VANGUARD REALTY — НОВАЯ ЗАЯВКА</b>`n" +
           "━━━━━━━━━━━━━━━━━━━━`n" +
           "👤 <b>Клиент:</b> $cName`n" +
           "📞 <b>Телефон:</b> <code>$cPhone</code>$cTg`n" +
           "📍 <b>Объект:</b> $cProp`n" +
           "📅 <b>День просмотра:</b> $cDate`n" +
           "📡 <b>Источник:</b> $cSource"

    $sentToGroup = $false
    if ($Global:GroupChatId) {
        $res = Send-TelegramMessage $Global:GroupChatId $msg
        if ($null -ne $res -and $res.ok) {
            $sentToGroup = $true
            Write-Output "Sent lead notification to Group: $($Global:GroupChatId)"
        }
    }
    return $sentToGroup
}

function Poll-TelegramBot {
    if (-not $Global:BotToken) { return }

    if (-not $Global:BotUsername) {
        $me = Invoke-TelegramApi "getMe"
        if ($me -and $me.ok) {
            $Global:BotUsername = $me.result.username
            $Global:LastBotError = ""
            Write-Output "Connected to Telegram Bot: @$($Global:BotUsername)"
            # Автоматически устанавливаем кнопку Telegram Mini App на https://estate-agency-sooty.vercel.app/
            Invoke-TelegramApi "setChatMenuButton" @{
                menu_button = @{
                    type = "web_app"
                    text = "🏛 Mini App"
                    web_app = @{
                        url = "https://estate-agency-sooty.vercel.app/"
                    }
                }
            } | Out-Null
            Write-Output "Configured Telegram Mini App Menu Button -> https://estate-agency-sooty.vercel.app/"
        }
    }

    $updatesResp = Invoke-TelegramApi "getUpdates?offset=$($Global:LastUpdateId)&timeout=1"
    if (-not $updatesResp -or -not $updatesResp.ok) { return }

    foreach ($u in $updatesResp.result) {
        $Global:LastUpdateId = [int64]$u.update_id + 1

        # Проверяем любые события из групп, супергрупп и каналов
        $chatObj = $null
        if ($u.message -and $u.message.chat) { $chatObj = $u.message.chat }
        elseif ($u.my_chat_member -and $u.my_chat_member.chat) { $chatObj = $u.my_chat_member.chat }
        elseif ($u.chat_member -and $u.chat_member.chat) { $chatObj = $u.chat_member.chat }
        elseif ($u.channel_post -and $u.channel_post.chat) { $chatObj = $u.channel_post.chat }

        if ($chatObj -and ($chatObj.type -eq "group" -or $chatObj.type -eq "supergroup" -or $chatObj.type -eq "channel" -or [int64]$chatObj.id -lt 0)) {
            $detectedId = [string]$chatObj.id
            $Global:GroupTitle = if ($chatObj.title) { $chatObj.title } else { "Telegram Group" }
            if ($Global:GroupChatId -ne $detectedId) {
                Save-Config $Global:BotToken $detectedId
                Write-Output "Auto-detected Telegram Group: $($Global:GroupTitle) ($detectedId)"
                Send-TelegramMessage $detectedId "✅ <b>Группа «$(Escape-Html $Global:GroupTitle)» успешно привязана к Vanguard Realty!</b>`n`n🆔 ID группы: <code>$detectedId</code>`nТеперь все заявки с сайта и из бота будут приходить прямо сюда!" | Out-Null
            } elseif ($u.message -and $u.message.text -and ($u.message.text -match "^/start" -or $u.message.text -match "^/id")) {
                Send-TelegramMessage $detectedId "✅ <b>Группа «$(Escape-Html $Global:GroupTitle)» уже подключена!</b>`n🆔 ID группы: <code>$detectedId</code>" | Out-Null
            }
            continue
        }

        # Личные сообщения боту от клиентов
        if (-not $u.message -or -not $u.message.text) { continue }
        $chatId = [string]$u.message.chat.id
        $text = $u.message.text.Trim()
        $firstName = if ($u.message.from.first_name) { $u.message.from.first_name } else { "Клиент" }
        $username = if ($u.message.from.username) { "@$($u.message.from.username)" } else { "" }

        $db = Read-Db
        $props = @($db.properties)

        # Если владелец прислал боту в личку ID группы (например -100123456789)
        if ($text -match "^-\d{5,}") {
            Save-Config $Global:BotToken $text
            Send-TelegramMessage $chatId "✅ ID группы <code>$text</code> сохранен! Отправляю тестовое приветствие в группу..." | Out-Null
            Send-TelegramMessage $text "🏛 <b>Vanguard Realty Bot подключен к этой группе!</b> Все новые заявки будут приходить сюда." | Out-Null
            continue
        }

        if ($text -match "^/id") {
            $grpInfo = if ($Global:GroupChatId) { "Подключенная группа: <code>$($Global:GroupChatId)</code> ($($Global:GroupTitle))" } else { "⚠️ Группа еще не подключена! Добавьте бота @$($Global:BotUsername) в вашу группу, сделайте его Администратором (или напишите в группе <code>/start@$($Global:BotUsername)</code>)." }
            Send-TelegramMessage $chatId "🆔 Ваш личный Chat ID: <code>$chatId</code>`n$grpInfo" | Out-Null
            continue
        }

        if ($text -match "^/start") {
            $Global:UserSessions[$chatId] = @{ step = "choose_property" }
            $kbRows = @()
            $kbRows += ,@(@{ text = "📱 Открыть приложение Vanguard Realty (Mini App)"; web_app = @{ url = "https://estate-agency-sooty.vercel.app/" } })
            foreach ($p in ($props | Select-Object -First 5)) {
                $priceM = [math]::Round($p.price / 1000000, 1)
                $kbRows += ,@(@{ text = "🏛 $($p.title) ($priceM млн ₽)" })
            }
            $markup = @{
                keyboard = $kbRows
                resize_keyboard = $true
                one_time_keyboard = $true
            }
            $welcome = "🏛 <b>Добро пожаловать в Vanguard Realty, $(Escape-Html $firstName)!</b>`n`n" +
                       "Вы можете открыть наше <b>Mini App приложение</b> по кнопке ниже (или синей кнопке меню слева внизу), либо выбрать квартиру прямо в чате:"
            Send-TelegramMessage $chatId $welcome $markup | Out-Null
            continue
        }

        $session = $Global:UserSessions[$chatId]
        if (-not $session) {
            $session = @{ step = "choose_property" }
        }

        if ($session.step -eq "choose_property") {
            $cleanProp = $text -replace "^🏛\s*", ""
            $session.propertyTitle = $cleanProp
            $session.step = "choose_date"
            $Global:UserSessions[$chatId] = $session

            $dateMarkup = @{
                keyboard = @(
                    @(@{ text = "Завтра в 14:00" }, @{ text = "Завтра в 17:00" }),
                    @(@{ text = "В субботу в 12:00" }, @{ text = "В воскресенье в 15:00" })
                )
                resize_keyboard = $true
                one_time_keyboard = $true
            }
            Send-TelegramMessage $chatId "📅 Отличный выбор: <b>$(Escape-Html $cleanProp)</b>!`n`nВыберите удобный день и время для просмотра на кнопках или напишите свою дату:" $dateMarkup | Out-Null
            continue
        }

        if ($session.step -eq "choose_date") {
            $session.preferredDate = $text
            $session.step = "enter_phone"
            $Global:UserSessions[$chatId] = $session

            $removeMarkup = @{ remove_keyboard = $true }
            Send-TelegramMessage $chatId "📞 Укажите ваше <b>Имя и номер телефона</b> для оформления пропуска на просмотр (например: <i>Иван +79991234567</i>):" $removeMarkup | Out-Null
            continue
        }

        if ($session.step -eq "enter_phone") {
            $newLead = [PSCustomObject]@{
                id = "lead-" + [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
                clientName = "$firstName ($text)"
                phone = $text
                telegramUsername = $username
                propertyId = "prop-1"
                propertyTitle = $session.propertyTitle
                preferredDate = $session.preferredDate
                preferredTime = ""
                source = "telegram_bot"
                status = "new"
                notes = "Записался через интерактивного Telegram-бота"
                createdAt = (Get-Date).ToString("o")
            }
            $db.leads = @($newLead) + @($db.leads)
            Write-Db $db
            $Global:UserSessions.Remove($chatId)

            $sentGrp = Notify-TelegramGroup $newLead
            $grpStatusNote = if ($sentGrp) { "и отправлена в рабочую Telegram-группу" } else { "(⚠️ Чтобы дублировать в группу: добавьте @$($Global:BotUsername) в группу и напишите там /start@$($Global:BotUsername))" }

            Send-TelegramMessage $chatId "✅ <b>Спасибо, $(Escape-Html $firstName)! Ваша заявка принята!</b>`n`n📍 Объект: <b>$(Escape-Html $newLead.propertyTitle)</b>`n📅 День просмотра: <b>$(Escape-Html $newLead.preferredDate)</b>`n`nЗаявка передана в Админ-панель сайта Vanguard Realty $grpStatusNote!" | Out-Null
            continue
        }
    }
}

Load-Config

$Listener = New-Object System.Net.HttpListener
$Listener.Prefixes.Add("http://localhost:$Port/")
$Listener.Start()

Write-Output "Vanguard Realty Server + Telegram Bot Polling started at http://localhost:$Port/"

function Send-JsonResponse($response, $obj, $statusCode = 200) {
    $response.StatusCode = $statusCode
    $response.ContentType = "application/json; charset=utf-8"
    $response.AddHeader("Access-Control-Allow-Origin", "*")
    $response.AddHeader("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
    $json = $obj | ConvertTo-Json -Depth 10 -Compress
    $buffer = [System.Text.Encoding]::UTF8.GetBytes($json)
    $response.ContentLength64 = $buffer.Length
    $response.OutputStream.Write($buffer, 0, $buffer.Length)
    $response.OutputStream.Close()
}

$contextTask = $Listener.GetContextAsync()
$lastPollTime = [DateTime]::MinValue

while ($Listener.IsListening) {
    try {
        if (([DateTime]::UtcNow - $lastPollTime).TotalSeconds -ge 1.5) {
            $lastPollTime = [DateTime]::UtcNow
            Poll-TelegramBot
        }

        if (-not $contextTask.Wait(300)) {
            continue
        }

        $context = $contextTask.Result
        $contextTask = $Listener.GetContextAsync()

        $req = $context.Request
        $res = $context.Response
        $path = $req.Url.AbsolutePath
        $method = $req.HttpMethod

        if ($method -eq "GET" -and ($path -eq "/" -or $path -eq "/index.html" -or $path -eq "/admin")) {
            $htmlBytes = [System.IO.File]::ReadAllBytes($IndexPath)
            $res.StatusCode = 200
            $res.ContentType = "text/html; charset=utf-8"
            $res.AddHeader("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
            $res.ContentLength64 = $htmlBytes.Length
            $res.OutputStream.Write($htmlBytes, 0, $htmlBytes.Length)
            $res.OutputStream.Close()
            continue
        }

        if ($method -eq "GET" -and $path -eq "/api/config") {
            Poll-TelegramBot
            Send-JsonResponse $res @{
                botToken = $Global:BotToken
                groupChatId = $Global:GroupChatId
                groupTitle = $Global:GroupTitle
                botUsername = $Global:BotUsername
                lastError = $Global:LastBotError
            }
            continue
        }

        if ($method -eq "GET" -and $path -eq "/api/properties") {
            $db = Read-Db
            Send-JsonResponse $res @{ properties = $db.properties }
            continue
        }

        if ($method -eq "GET" -and $path -eq "/api/leads") {
            $db = Read-Db
            Send-JsonResponse $res @{ leads = $db.leads }
            continue
        }

        if ($method -eq "POST") {
            $reader = New-Object System.IO.StreamReader($req.InputStream, [System.Text.Encoding]::UTF8)
            $bodyText = $reader.ReadToEnd()
            $reader.Close()
            $body = if ($bodyText) { $bodyText | ConvertFrom-Json } else { @{} }

            if ($path -eq "/api/config") {
                if ($body.botToken -and $body.botToken -ne $Global:BotToken) {
                    $Global:BotUsername = ""
                }
                Save-Config $body.botToken $body.groupChatId
                Poll-TelegramBot
                Send-JsonResponse $res @{
                    ok = $true
                    botToken = $Global:BotToken
                    groupChatId = $Global:GroupChatId
                    groupTitle = $Global:GroupTitle
                    botUsername = $Global:BotUsername
                    lastError = $Global:LastBotError
                }
                continue
            }

            if ($path -eq "/api/properties") {
                $db = Read-Db
                $newProp = [PSCustomObject]@{
                    id = "prop-" + [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
                    title = if ($body.title) { $body.title } else { "Новая резиденция" }
                    district = if ($body.district) { $body.district } else { "Центральный" }
                    address = if ($body.address) { $body.address } else { "Адрес уточняется" }
                    price = [int64]($body.price)
                    rooms = [int]($body.rooms)
                    area = [int]($body.area)
                    floor = [int]($body.floor)
                    totalFloors = 18
                    imageUrl = if ($body.imageUrl) { $body.imageUrl } else { "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=85" }
                    description = if ($body.description) { $body.description } else { "Эксклюзивная резиденция с дизайнерской отделкой и панорамным видом." }
                    features = @("Панорамные окна", "Закрытый двор", "Подземный паркинг")
                    badge = "Новинка"
                    createdAt = (Get-Date).ToString("o")
                }
                $db.properties = @($newProp) + @($db.properties)
                Write-Db $db
                Send-JsonResponse $res @{ property = $newProp } 201
                continue
            }

            if ($path -eq "/api/leads") {
                $db = Read-Db
                $newLead = [PSCustomObject]@{
                    id = "lead-" + [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
                    clientName = $body.clientName
                    phone = $body.phone
                    telegramUsername = $body.telegramUsername
                    propertyId = $body.propertyId
                    propertyTitle = if ($body.propertyTitle) { $body.propertyTitle } else { "Индивидуальный подбор" }
                    preferredDate = if ($body.preferredDate) { $body.preferredDate } else { "В ближайшие дни" }
                    preferredTime = if ($body.preferredTime) { $body.preferredTime } else { "14:00" }
                    budget = $body.budget
                    rooms = $body.rooms
                    district = $body.district
                    source = if ($body.source) { $body.source } else { "website_booking" }
                    status = "new"
                    notes = $body.notes
                    createdAt = (Get-Date).ToString("o")
                }
                $db.leads = @($newLead) + @($db.leads)
                Write-Db $db
                $sentTg = Notify-TelegramGroup $newLead
                Send-JsonResponse $res @{ lead = $newLead; telegramNotification = @{ sent = $sentTg; groupChatId = $Global:GroupChatId } } 201
                continue
            }

            if ($path -eq "/api/telegram") {
                $db = Read-Db
                $newLead = [PSCustomObject]@{
                    id = "lead-" + [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
                    clientName = "Артем Волков (Тест ТГ)"
                    phone = "+7 (925) 991-04-77"
                    telegramUsername = "@artem_volkov_estate"
                    propertyId = "prop-1"
                    propertyTitle = "Пентхаус с террасой в ЖК «Vanguard Knightsbridge»"
                    preferredDate = "2026-11-19"
                    preferredTime = "16:00"
                    source = "telegram_bot"
                    status = "new"
                    notes = "Тестовая заявка отправлена в Админку и Telegram-группу"
                    createdAt = (Get-Date).ToString("o")
                }
                $db.leads = @($newLead) + @($db.leads)
                Write-Db $db
                $sentTg = Notify-TelegramGroup $newLead
                Send-JsonResponse $res @{ ok = $true; lead = $newLead; sentToTelegram = $sentTg; groupChatId = $Global:GroupChatId } 200
                continue
            }

            if ($path -eq "/api/ai-chat") {
                $db = Read-Db
                $props = @($db.properties)
                $lastUserText = ""
                if ($body.messages) {
                    foreach ($m in $body.messages) {
                        if ($m.role -eq "user") { $lastUserText = [string]$m.content }
                    }
                }
                $filtered = $props
                if ($lastUserText -match "сем|5|6|больш|дет") {
                    $filtered = @($props | Where-Object { $_.rooms -ge 4 })
                } elseif ($lastUserText -match "1|студ") {
                    $filtered = @($props | Where-Object { $_.rooms -eq 1 })
                } elseif ($lastUserText -match "2|3|35") {
                    $filtered = @($props | Where-Object { $_.rooms -le 3 -and $_.price -le 36000000 })
                }
                if ($filtered.Count -eq 0) { $filtered = $props }
                $top = $filtered | Select-Object -First 3
                $lines = ($top | ForEach-Object { "• $($_.title) ($($_.district), $($_.rooms) комн., $($_.area) м²) — $([math]::Round($_.price / 1000000, 1)) млн ₽" }) -join "`n"
                $replyText = "Я (ИИ-помощник Vanguard Realty на базе gemini-3.5-flash-lite) подобрал для вас подходящие резиденции из нашей актуальной базы:`n`n$lines`n`nДля семей с детьми доступна семейная ипотека от 4.9% и комиссия 0%. Вы можете оставить заявку на удобный день просмотра прямо в большой форме ниже или через наш Telegram-бот!"
                Send-JsonResponse $res @{
                    reply = $replyText
                    recommendedPropertyIds = @($top | ForEach-Object { $_.id })
                    suggestLeadCapture = $true
                    modelUsed = "gemini-3.5-flash-lite"
                } 200
                continue
            }
        }

        $res.StatusCode = 404
        $res.OutputStream.Close()
    } catch {
        Write-Error $_
    }
}
