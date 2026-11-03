import Link from "next/link";
import JosekiMotion from "../../projects/JosekiMotion";
import JosekiStory from "../../projects/JosekiStory";
export default function Studies(){return <main><header className="site-header"><Link href="/projects/joseki">Back to joseki</Link><Link href="/joseki/studies/unit-division">Unit Division film</Link><span>Motion studies / preserved explorations</span></header><JosekiMotion/><JosekiStory/></main>}
