Add-Type -AssemblyName System.Speech
$s = New-Object System.Speech.Synthesis.SpeechSynthesizer
$s.SelectVoice('Microsoft Zira Desktop')
$s.Rate = -2
$s.Volume = 100
$outputFile = (Join-Path (Get-Location) 'backend\app\static\media\audio\sarah_voice.wav')
$s.SetOutputToWaveFile($outputFile)
$s.Speak('Hello Mum, it is Sarah. I am just checking in on you. Remember that you are safe, you are loved, and I will be over to visit this evening. Take a gentle breath, have a cup of tea, and remember you are never alone. I love you lots, Mum.')
$s.Dispose()
Write-Host "Generated: $outputFile"

$mobileFile = (Join-Path (Get-Location) 'mobile\assets\media\audio\sarah_voice.wav')
Copy-Item $outputFile $mobileFile -Force
Write-Host "Copied to mobile: $mobileFile"
