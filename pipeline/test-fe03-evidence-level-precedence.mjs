import { parsePubmedXml } from "./adapters/pubmed-xml.mjs";
import { adapterByProvider } from "./adapters/normalize.mjs";
import { classifyEvidenceLevel } from "./lib/evidence-engine.mjs";

function fixture({pmid,phase,title}){
  return `<?xml version="1.0"?>
<PubmedArticleSet><PubmedArticle><MedlineCitation>
<PMID>${pmid}</PMID><Article>
<ArticleTitle>${title}</ArticleTitle>
<Abstract><AbstractText>This randomized controlled trial enrolled human participants.</AbstractText></Abstract>
<PublicationTypeList>
<PublicationType>Journal Article</PublicationType>
<PublicationType>Clinical Trial, Phase ${phase}</PublicationType>
<PublicationType>Randomized Controlled Trial</PublicationType>
</PublicationTypeList>
</Article><MeshHeadingList><MeshHeading><DescriptorName>Humans</DescriptorName></MeshHeading></MeshHeadingList>
</MedlineCitation><PubmedData><ArticleIdList><ArticleId IdType="pubmed">${pmid}</ArticleId></ArticleIdList></PubmedData>
</PubmedArticle></PubmedArticleSet>`;
}

const phase2=parsePubmedXml(fixture({
  pmid:"90000021",
  phase:"II",
  title:"A phase II randomized controlled trial"
}));
const phase3=parsePubmedXml(fixture({
  pmid:"90000022",
  phase:"III",
  title:"A phase III randomized controlled trial"
}));

if(phase2?.study_stage!=="phase2"){
  throw new Error("explicit PubMed phase II lost to generic randomized tag");
}
if(classifyEvidenceLevel(adapterByProvider.pubmed(phase2).source)!=="early_human"){
  throw new Error("phase II must map to early_human");
}
if(phase3?.study_stage!=="phase3"){
  throw new Error("explicit PubMed phase III lost to generic randomized tag");
}
if(classifyEvidenceLevel(adapterByProvider.pubmed(phase3).source)!=="controlled_human"){
  throw new Error("phase III must map to controlled_human");
}

console.log("FE03_EVIDENCE_LEVEL_PRECEDENCE_PASS|phase2=early_human|phase3=controlled_human|explicit_phase_over_randomized=1");
