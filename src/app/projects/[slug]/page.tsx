import type { Metadata } from "next";
import { Fragment } from "react";
import HomeLanguage, { HomeText, HomeLanguageSwitch } from "../../HomeLanguage";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import ProjectGallery from "../ProjectGallery";
import ViewportVideo from "../ViewportVideo";
import FollowOnImages from "../FollowOnImages";
import FiveByFiveEvidence from "../FiveByFiveEvidence";
import FivePresentation from "../FivePresentation";
import McpEvidence, { McpBridge } from "../McpEvidence";
import CalPolyEvidence from "../CalPolyEvidence";
import CalPolySystem from "../CalPolySystem";
import CalPolyKitFilm from "../CalPolyKitFilm";
import CalPolyProjectImages from "../CalPolyProjectImages";
import JosekiStory from "../JosekiStory";
import JosekiMotion from "../JosekiMotion";
import JosekiProduct from "../JosekiProduct";
import { projects, navigationProjects, getNextProject } from "../data";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = projects.find((item) => item.slug === slug);
  if (!project) return {};
  return { title: `${project.title} — Dongwoo Suk`, description: project.deck };
}

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params;
  const projectIndex = projects.findIndex((item) => item.slug === slug);
  if (projectIndex < 0) notFound();
  const project = projects[projectIndex];
  if (slug === "joseki") return <JosekiProduct />;
  const next = getNextProject(slug);

  const refined = slug === "rhino-grasshopper-mcp" || slug === "cal-poly-facade" || slug === "adg-massing-pilot" || slug === "five-by-five-bim";
  const LanguageWrapper = refined ? HomeLanguage : Fragment;
  return (
    <LanguageWrapper><main className={`case-page${slug === "rhino-grasshopper-mcp" ? " case-page--mcp" : ""}${refined ? " case-page--refined" : ""}${slug === "adg-massing-pilot" ? " case-page--adg" : ""}${slug === "five-by-five-bim" ? " case-page--five" : ""}${slug === "cal-poly-facade" ? " case-page--calpoly" : ""}`} id="top">
      <header className="site-header">
        {refined ? <Link className="case-clean-wordmark" href="/">DONGWOO SUK / PORTFOLIO</Link> : <Link className="wordmark" href="/" aria-label="Dongwoo Suk, portfolio home"><span className="wordmark-symbol"><HomeText>{"D"}</HomeText><span>W</span></span><span className="wordmark-name"><HomeText>{"DONGWOO SUK"}</HomeText><span> <HomeText>{"/ PORTFOLIO"}</HomeText></span></span></Link>}
        <nav className="case-header-nav" aria-label="Project navigation"><Link href="/#work"><HomeText>{"All projects"}</HomeText></Link><Link href="/#about"><HomeText>{"About"}</HomeText></Link></nav>
        {refined && <HomeLanguageSwitch />}
      </header>

      {project.slug === "joseki" && <JosekiMotion />}

      <section className="case-intro section-shell">
        <Link className="case-back" href="/#work"><HomeText>{"← All selected work"}</HomeText></Link>
        <div className="case-intro-top"><span>{project.number} / {String(navigationProjects.length).padStart(2, "0")}</span><span><HomeText>{project.category}</HomeText></span></div>
        <h1><HomeText>{project.title}</HomeText></h1>
        <p className="case-deck"><HomeText>{project.deck}</HomeText></p>
        <div className={`case-meta${refined ? " case-meta--compact" : ""}`}><div><span><HomeText>{"CONTEXT"}</HomeText></span><strong><HomeText>{project.context}</HomeText></strong></div>{!refined && <div><span><HomeText>{"MY CONTRIBUTION"}</HomeText></span><strong><HomeText>{project.contribution}</HomeText></strong></div>}<div><span><HomeText>{"TOOLS"}</HomeText></span><strong><HomeText>{project.tools}</HomeText></strong></div></div>
      </section>

      <section className="case-summary section-shell" aria-label="Case study at a glance">
        <span className="section-kicker"><HomeText>{"AT A GLANCE"}</HomeText></span>
        <div className={`case-summary-grid${refined ? " case-summary-grid--compact" : ""}`}>
          {!refined && <article><span><HomeText>{"01 / DESIGN PROBLEM"}</HomeText></span><h2><HomeText>{project.question}</HomeText></h2></article>}
          <article><span><HomeText>{slug === "cal-poly-facade" ? "MY ROLE" : refined ? "01 / MY ROLE" : "02 / MY ROLE"}</HomeText></span><p><HomeText>{project.contribution}</HomeText></p></article>
          <article><span><HomeText>{slug === "cal-poly-facade" ? "OUTPUT" : refined ? "02 / OUTPUT" : "03 / OUTPUT"}</HomeText></span><p><HomeText>{project.outcome}</HomeText></p></article>
        </div>
        <nav className="case-reading-nav" aria-label="Within this case study"><a href="#process"><HomeText>{"Design process ↓"}</HomeText></a><a href={slug === "cal-poly-facade" ? "#evidence" : "#gallery"}><HomeText>{"Visual evidence ↓"}</HomeText></a><a href="#scope"><HomeText>{"Project status ↓"}</HomeText></a></nav>
      </section>

      {project.slug === "joseki" && <JosekiStory />}

      {project.leadImage ? <section className="case-film" aria-label="Project image">
        {slug === "cal-poly-facade" ? <CalPolyProjectImages /> : <div className="case-lead-image"><Image src={project.leadImage.src} alt={project.leadImage.alt} fill priority sizes="100vw" /></div>}
        <div className="case-film-caption section-shell"><span><HomeText>{slug === "cal-poly-facade" ? "PROJECT IMAGE" : "01 / PROJECT IMAGE"}</HomeText></span><p><HomeText>{project.leadImage.caption}</HomeText></p></div>
      </section> : project.video && project.videoCaption && <section className="case-film" aria-label="Project animation">
        {slug === "five-by-five-bim" ? <div className="five-intro-pair section-shell"><div className="five-intro-motion"><ViewportVideo src={project.video} poster={project.cover} label={project.videoCaption} /></div><a className="five-intro-render" href="/work/five-by-five/ai-rendering.jpg" target="_blank" rel="noreferrer"><Image src="/work/five-by-five/ai-rendering.jpg" alt="5 by 5 building / AI rendering" fill sizes="(max-width: 760px) 90vw, 44vw" /></a></div> : <video src={project.video} poster={project.videoPoster ?? project.cover} muted loop playsInline controls preload="metadata" aria-label={project.videoCaption} />}
        <div className="case-film-caption section-shell"><span><HomeText>{"01 / IN MOTION"}</HomeText></span><p><HomeText>{project.videoCaption}</HomeText></p></div>
      </section>}

      <section className="case-narrative section-shell" aria-labelledby="case-question"><span className="section-kicker"><HomeText>{slug === "cal-poly-facade" ? "01 / DESIGN QUESTION" : "THE DESIGN QUESTION"}</HomeText></span><div className="case-question-column"><h2 id="case-question"><HomeText>{project.question}</HomeText></h2>{project.overviewImage && <figure className="case-overview"><a className="case-overview-image" href={project.overviewImage.src} target="_blank" rel="noreferrer" aria-label="Open full project overview image"><Image src={project.overviewImage.src} alt={project.overviewImage.alt} fill sizes="(max-width: 760px) 100vw, 40vw" /></a><figcaption><HomeText>{project.overviewImage.caption}</HomeText></figcaption></figure>}{slug === "cal-poly-facade" && <figure className="case-campus-context"><a href="/work/facade/renderings/23133_000_high_web.jpg" target="_blank" rel="noreferrer" aria-label="Open full campus project visualization"><Image src="/work/facade/renderings/23133_000_high_web.jpg" alt="Aerial project visualization showing the housing buildings within the wider Cal Poly campus" fill unoptimized loading="eager" sizes="(max-width: 760px) 90vw, 30vw" /></a><figcaption><HomeText>{"PROJECT CONTEXT / CAL POLY CAMPUS"}</HomeText> <span aria-hidden="true">↗</span></figcaption></figure>}</div><div className="case-narrative-grid"><div><span><HomeText>{"THE WORKFLOW"}</HomeText></span><p><HomeText>{project.approach}</HomeText></p></div><div><span><HomeText>{"WHAT IT SHOWS"}</HomeText></span><p><HomeText>{project.result}</HomeText></p>{project.resultPoints && <ol className="case-result-list">{project.resultPoints.map((point) => <li key={point.label}><strong><HomeText>{point.label}</HomeText></strong><p><HomeText>{point.text}</HomeText></p></li>)}</ol>}</div></div></section>

      {slug === "five-by-five-bim" && <FivePresentation />}

      {project.scope && <section className="case-scope section-shell" aria-label="Project roles and handoffs">{project.scope.map((item) => <article key={item.label}><span><HomeText>{item.label}</HomeText></span><h2><HomeText>{item.title}</HomeText></h2><p><HomeText>{item.detail}</HomeText></p></article>)}</section>}

      {slug === "cal-poly-facade" ? <CalPolySystem /> : <section className="case-decisions section-shell" id="process" aria-labelledby="case-decisions-title"><div className="case-decisions-heading"><span className="section-kicker"><HomeText>{"02 / PROCESS"}</HomeText></span><h2 id="case-decisions-title"><HomeText>{project.processHeading}</HomeText></h2><p><HomeText>{project.processIntro}</HomeText></p></div>{slug === "rhino-grasshopper-mcp" && <McpBridge />}<div className="case-decision-list">{project.processSteps.map((step) => <article className="case-decision" key={step.label}><div className="case-decision-copy"><span><HomeText>{step.label}</HomeText></span><h3><HomeText>{step.title}</HomeText></h3><p><HomeText>{step.detail}</HomeText></p></div></article>)}</div></section>}

      {slug === "cal-poly-facade" && <CalPolyEvidence />}
      {slug === "rhino-grasshopper-mcp" ? <McpEvidence /> : slug === "five-by-five-bim" ? <FiveByFiveEvidence /> : <section className="case-gallery-section section-shell" id="gallery" aria-labelledby="case-gallery-title"><div className="case-section-heading"><div><span className="section-kicker"><HomeText>{slug === "cal-poly-facade" ? "04 / MODEL ORGANIZATION" : "03 / PROCESS & EVIDENCE"}</HomeText></span><h2 id="case-gallery-title"><HomeText>{slug === "cal-poly-facade" ? "Organize the parts." : "Follow the work,"}</HomeText><br /><em><HomeText>{slug === "cal-poly-facade" ? "Review the whole." : "frame by frame."}</HomeText></em></h2></div><p><HomeText>{project.galleryIntro ?? "These are different views of the same study: options, working geometry, model organization, and review outputs."}</HomeText></p></div>{slug === "cal-poly-facade" && <CalPolyKitFilm />}{slug === "cal-poly-facade" ? <><figure className="cp-final-kit"><a href={project.slides[0].src} target="_blank" rel="noreferrer"><Image src={project.slides[0].src} alt={project.slides[0].alt} width={6316} height={3459} sizes="90vw" /></a></figure><div className="cp-case-result"><span className="section-kicker"><HomeText>{"RESULT"}</HomeText></span><p><HomeText>{"Connected part geometry and placement rules through scripts, then organized the facade by panel type for review."}</HomeText></p></div></> : <ProjectGallery slides={project.slides} groups={project.galleryGroups} />}</section>}

      {project.clips && <section className="case-clips section-shell" id="clips" aria-labelledby="case-clips-title"><div className="case-section-heading"><div><span className="section-kicker"><HomeText>{"04 / MOTION STUDIES"}</HomeText></span><h2 id="case-clips-title"><HomeText>{"Watch the choices"}</HomeText><br /><em><HomeText>{"change."}</HomeText></em></h2></div><p><HomeText>{"Clips play automatically when in view. Follow circulation, unit layouts, and facade options in three groups."}</HomeText></p></div><div className="case-clips-grid">{project.clips.map((clip, clipIndex) => <Fragment key={clip.src}>{slug === "adg-massing-pilot" && [0, 3, 4].includes(clipIndex) && <h3 className="adg-motion-group"><HomeText>{clipIndex === 0 ? "01 / CIRCULATION" : clipIndex === 3 ? "02 / UNIT LAYOUTS" : "03 / FACADE OPTIONS"}</HomeText></h3>}<article className="case-clip" key={clip.src}>{slug === "adg-massing-pilot" ? <ViewportVideo src={clip.src} poster={clip.poster} label={clip.title} /> : <video src={clip.src} poster={clip.poster} controls playsInline preload="none" aria-label={clip.title} />}<div><h3><HomeText>{clip.title}</HomeText></h3><p><HomeText>{clip.detail}</HomeText></p></div></article></Fragment>)}</div></section>}

      {project.secondVideo && slug !== "five-by-five-bim" && <section className="case-second-film section-shell" id="secondary-film"><div><span className="section-kicker"><HomeText>{project.secondVideo.label}</HomeText></span><h2><HomeText>{project.secondVideo.title}</HomeText></h2><p><HomeText>{project.secondVideo.caption}</HomeText></p></div>{slug === "five-by-five-bim" ? <ViewportVideo src={project.secondVideo.src} poster={project.cover} label={project.secondVideo.caption} /> : <video src={project.secondVideo.src} poster={project.cover} muted loop playsInline controls preload="metadata" aria-label={project.secondVideo.caption} />}</section>}

      {slug === "adg-massing-pilot" && <section className="adg-result section-shell"><span className="section-kicker"><HomeText>{"RESULT"}</HomeText></span><p><HomeText>{"Connected circulation, unit distribution, and opening limits in one adjustable workflow, making layout and facade options available for design review."}</HomeText></p></section>}

      {project.followOns && <section className="case-followons section-shell" aria-labelledby="case-followons-title"><div className="case-section-heading"><div><span className="section-kicker"><HomeText>{"05 / TEAM PILOT CONTEXT"}</HomeText></span><h2 id="case-followons-title"><HomeText>{"Where the shared"}</HomeText><br /><em><HomeText>{"model could go."}</HomeText></em></h2></div><p><HomeText>{"These exploratory images come from the wider ADG pilot. They show possible analysis, BIM handoff, and visualization connections without expanding the individual contribution described above."}</HomeText></p></div><div className="case-followons-grid">{project.followOns.map((item) => <article className="case-followon" key={item.title}><h3><HomeText>{item.title}</HomeText></h3><p><HomeText>{item.detail}</HomeText></p>{slug === "adg-massing-pilot" ? <FollowOnImages images={item.images} /> : <div className={`case-followon-images${item.images.length === 1 ? " case-followon-images--single" : ""}`}>{item.images.map((asset) => <figure key={asset.src}><a className="case-followon-image" href={asset.src} target="_blank" rel="noreferrer" aria-label={`Open full image: ${asset.label}`}><Image src={asset.src} alt={asset.alt} fill sizes={item.images.length === 1 ? "(max-width: 1050px) 90vw, 30vw" : "(max-width: 1050px) 43vw, 15vw"} /></a><figcaption><HomeText>{asset.label}</HomeText></figcaption></figure>)}</div>}</article>)}</div></section>}

      <section className="case-caveat section-shell" id="scope"><span><HomeText>{"STATUS / SCOPE"}</HomeText></span><p><HomeText>{project.caveat}</HomeText></p></section>
      <Link className="case-next section-shell" href={`/projects/${next.slug}`}><span><HomeText>{"NEXT PROJECT /"}</HomeText> {next.number}</span><strong><HomeText>{next.title}</HomeText></strong><b aria-hidden="true">↗</b></Link>
      <footer className="site-footer section-shell"><span><HomeText>{"© 2026 DONGWOO SUK"}</HomeText></span><span><HomeText>{"DESIGN · COMPUTATION · DELIVERY"}</HomeText></span><a href="#top"><HomeText>{"BACK TO TOP ↑"}</HomeText></a></footer>
    </main></LanguageWrapper>
  );
}
