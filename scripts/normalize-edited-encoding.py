from pathlib import Path
import subprocess
paths = subprocess.check_output(["git", "diff", "--name-only"], text=True, stderr=subprocess.DEVNULL).splitlines()
for name in paths:
    p = Path(name)
    if not p.is_file() or p.suffix not in (".tsx", ".ts", ".py", ".css", ".md"): continue
    try: p.read_bytes().decode("utf-8")
    except UnicodeDecodeError:
        p.write_text(p.read_bytes().decode("cp1252"), encoding="utf-8")
        print("Normalized", name)

