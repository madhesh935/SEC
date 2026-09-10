import {Suspense} from "react";
import {AuthPage} from "@/components/portal/AuthPage";
export default function Page(){return <Suspense fallback={<p>Loading sign in…</p>}><AuthPage portal="family" /></Suspense>;}

