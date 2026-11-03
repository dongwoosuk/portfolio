"use client";
import {useJosekiText,JosekiLanguage} from "./JosekiLanguage";
import Link from "next/link";
import { getNextProject } from "./data";
import {useState} from "react";
import JosekiMoveWall from "./JosekiMoveWall";
import JosekiFacadeFilm from "./JosekiFacadeFilm";
import JosekiLibraryFilm from "./JosekiLibraryFilm";
const steps=[
 {title:"Discover",image:"joseki-prepare.png",description:"Explore candidate logic from existing definitions. Inspect the graph and review its preparation status.",alt:"joseki Explore showing candidate graphs and preparation status"},
 {title:"Inspect",image:"joseki-library.png",description:"Find a Move, trace its source definition, and inspect the available examples before reuse.",alt:"joseki Library showing source definitions, examples, and source inspection controls"},
 {title:"Insert",image:"joseki-insert.png",description:"Insert the selected Move into Grasshopper, connect your inputs, and adapt it to the next task.",alt:"joseki confirming five components inserted into the Grasshopper canvas"}
];
function JosekiContent(){
 const t=useJosekiText();
 const next=getNextProject("joseki");
 const [step,setStep]=useState(0);
 return <main className="jp"><header className="jp-nav jp-nav-clean"><Link href="/">DONGWOO SUK / PORTFOLIO</Link><a href="#product" className="joseki-brand"><strong className="joseki-logo">joseki</strong><span>{t("Reusable design knowledge")}</span></a></header>
 <section className="jp-intro" id="product"><div><span className="jp-eyebrow">{t("A REUSE LIBRARY FOR GRASSHOPPER")}</span><h1>{t("Your next project.")}<br/><em>{t("A move ahead.")}</em></h1></div><div className="jp-intro-right"><p>{t("Turn useful logic from past Grasshopper definitions into a library you can search, inspect, and reuse.")}</p><p className="jp-move-definition">{t("A ")}<strong>Move</strong>{t(" is a reusable piece of a definition, with its source and context attached.")}</p><a href="#workflow">{t("See a project become reusable ↓")}</a><span>{t("Working MVP / independently developed by Dongwoo Suk")}</span><p className="jp-role-summary">{t("Product design / Grasshopper integration / Validation workflows")}</p></div></section>
 <section className="jp-project-example" id="workflow"><div><span className="jp-eyebrow">{t("IT STARTS WITH A GRASSHOPPER DEFINITION")}</span><h2>{t("You built the script.")}<br/><em>{t("Keep the logic.")}</em></h2><p>{t("Behind the geometry is a definition worth using again. joseki helps you find the useful parts and bring them into your next workflow.")}</p></div><figure><a href="/work/joseki/grasshopper-workflow.jpg" target="_blank" rel="noreferrer" aria-label="View Grasshopper definition and model full size"><img src="/work/joseki/grasshopper-workflow.jpg" alt="An actual working screen with a Grasshopper definition, Rhino model, and corresponding Revit geometry" width="2000" height="1092"/></a><figcaption>{t("Grasshopper logic and its model, in the same working view.")}</figcaption></figure></section>
 <JosekiFacadeFilm />
 <section className="jp-interface" id="interface"><div><span className="jp-eyebrow">{t("02 / INSIDE THE WORKING PRODUCT")}</span><h2>{t("Find it.")}<br/>{t("Understand it.")}<br/><em>{t("Use it again.")}</em></h2><div className="jp-product-steps" role="group" aria-label="Product workflow screenshots">{steps.map((item,i)=><button key={t(item.title)} aria-pressed={step===i} onClick={()=>setStep(i)}><span>0{i+1}</span>{item.title}</button>)}</div><p aria-live="polite">{t(steps[step].description)}</p><p className="jp-note">{t("Trace the source, check readiness, and reuse with context. Preparation and execution checks remain separate.")}</p></div><figure><a href={`/work/tools/${steps[step].image}`} target="_blank" rel="noreferrer" aria-label={`Open full-size ${steps[step].title} screenshot`}><img src={`/work/tools/${steps[step].image}`} alt={steps[step].alt} loading="lazy" width="1212" height="770"/></a><figcaption>{steps[step].title}{" "}{t("/ open image to inspect the interface")}</figcaption></figure></section>
 <JosekiLibraryFilm />
 <JosekiMoveWall />
 <section className="jp-authorship" id="development"><div><span className="jp-eyebrow">{t("DESIGN TECHNOLOGY / INDEPENDENT DEVELOPMENT")}</span><h2>{t("From a practice problem")}<br/><em>{t("to a working tool.")}</em></h2><p>{t("I developed joseki to make useful project logic easier to recover, understand, and reuse.")}</p><p className="jp-tech">Python 3 / Grasshopper / Rhino.Inside / WPF</p></div><div className="jp-evidence"><article><h3>{t("My contribution")}</h3><p>{t("Library workflow and interface, source tracking, package preparation, scoped execution checks, and onboarding.")}</p></article><article><h3>{t("Recorded acceptance")}</h3><p>{t("Onboarding checks covered preparation, example opening, insertion, and reopening. Three supported functions passed thirteen fixture cases in the recorded distribution check.")}</p></article><article><h3>{t("Current scope")}</h3><p>{t("Working MVP with scoped validation. The library is broader than the tested set; the workspace combinations above illustrate possible reuse.")}</p></article></div></section>
 <Link className="jp-next-project" href={`/projects/${next.slug}`}><span>{t("NEXT PROJECT /")} {next.number}</span><strong>{t(next.title)}</strong><b aria-hidden="true">↗</b></Link>
 <footer className="jp-footer"><div><strong>Dongwoo Suk / Computational Design</strong><p>{t("Connecting architectural practice, reusable workflows, and tool development.")}</p></div><Link href="/#work">{t("View all projects →")}</Link></footer></main>;
}

export default function JosekiProduct(){return <JosekiLanguage.Provider value={false}><div lang="en"><JosekiContent/></div></JosekiLanguage.Provider>;}
