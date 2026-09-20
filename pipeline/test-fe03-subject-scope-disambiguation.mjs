import { parsePubmedXml } from "./adapters/pubmed-xml.mjs";
import { adapterByProvider } from "./adapters/normalize.mjs";
import { classifyEvidenceLevel, inferSubjectScope } from "./lib/evidence-engine.mjs";

const xml=`<?xml version="1.0"?>
<PubmedArticleSet><PubmedArticle><MedlineCitation>
<PMID>90000031</PMID><Article>
<ArticleTitle>A fatal mouse model with patient-relevant mutations</ArticleTitle>
<Abstract><AbstractText>Murine progenitors were transplanted into syngeneic mice and all recipients developed disease.</AbstractText></Abstract>
<PublicationTypeList><PublicationType>Journal Article</PublicationType></PublicationTypeList>
</Article>
</MedlineCitation><PubmedData><ArticleIdList><ArticleId IdType="pubmed">90000031</ArticleId></ArticleIdList></PubmedData>
</PubmedArticle></PubmedArticleSet>`;

const parsed=parsePubmedXml(xml);
const normalized=adapterByProvider.pubmed(parsed);

if(parsed?.subject_scope!=="animal") throw new Error("patient-relevant phrase created false human scope");
if(parsed?.study_stage!=="preclinical_animal") throw new Error("mouse-model stage not inferred");
if(inferSubjectScope(normalized.source)!=="animal") throw new Error("normalized animal scope lost");
if(classifyEvidenceLevel(normalized.source)!=="preclinical") throw new Error("animal model must map to preclinical");

console.log("FE03_SUBJECT_SCOPE_DISAMBIGUATION_PASS|patient_relevant_not_human=1|mouse_model=animal|evidence=preclinical");
