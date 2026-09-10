from pathlib import Path
for name in ["website/src/components/patient/PatientCard.tsx","website/app/dashboard/patients/page.tsx"]:
 p=Path(name);s=p.read_text(encoding="utf-8").replace("/dashboard/patients/","/caregiver/patients/").replace('router.push("/dashboard")','router.push("/caregiver")');p.write_text(s,encoding="utf-8")
# Repair Windows code-page conversions only where the entire sequence is unambiguously reversible.
for p in [*Path("website/src/components/portal").glob("*.tsx"),Path("website/app/layout.tsx")]:
 s=p.read_text(encoding="utf-8")
 replacements={}
 for character in ["…","→","·","—","’"]:
  broken=character.encode("utf-8").decode("cp1252")
  s=s.replace(broken,character)
 p.write_text(s,encoding="utf-8")

