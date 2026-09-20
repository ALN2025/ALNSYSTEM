Dim mode, fso, root, ps1, shell
mode = WScript.Arguments(0)
Set fso = CreateObject("Scripting.FileSystemObject")
root = fso.GetParentFolderName(fso.GetParentFolderName(WScript.ScriptFullName))

Set shell = CreateObject("WScript.Shell")
shell.CurrentDirectory = root

If mode = "pc" Then
  bat = root & "\ALN-SYSTEM-PC.bat"
  shell.Run """" & bat & """", 1, False
ElseIf mode = "apk" Then
  bat = root & "\COMPILAR-APK.bat"
  shell.Run """" & bat & """", 1, False
ElseIf mode = "build-pc" Then
  bat = root & "\COMPILAR-PC.bat"
  shell.Run """" & bat & """", 1, False
Else
  WScript.Quit 1
End If
