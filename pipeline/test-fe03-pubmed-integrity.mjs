import { parsePubmedXml } from "./adapters/pubmed-xml.mjs";
import { adapterByProvider } from "./adapters/normalize.mjs";
import { buildDossier } from "./lib/evidence-engine.mjs";

const originalXml=`<?xml version="1.0"?>
<PubmedArticleSet>
  <PubmedArticle>
    <MedlineCitation>
      <PMID>22489770</PMID>
      <Article>
        <ArticleTitle>Flexible and microporous synthetic fixture</ArticleTitle>
        <PublicationTypeList>
          <PublicationType>Journal Article</PublicationType>
          <PublicationType>Retracted Publication</PublicationType>
        </PublicationTypeList>
      </Article>
      <MeshHeadingList>
        <MeshHeading><DescriptorName>Humans</DescriptorName></MeshHeading>
        <MeshHeading><DescriptorName>Animals</DescriptorName></MeshHeading>
        <MeshHeading><DescriptorName>Rats</DescriptorName></MeshHeading>
      </MeshHeadingList>
      <CommentsCorrectionsList>
        <CommentsCorrections RefType="RetractionIn">
          <RefSource>ACS Appl Mater Interfaces. 2019.</RefSource>
          <PMID>31347354</PMID>
        </CommentsCorrections>
      </CommentsCorrectionsList>
    </MedlineCitation>
    <PubmedData>
      <ArticleIdList>
        <ArticleId IdType="pubmed">22489770</ArticleId>
        <ArticleId IdType="doi">10.1021/am300292v</ArticleId>
      </ArticleIdList>
    </PubmedData>
  </PubmedArticle>
</PubmedArticleSet>`;

const noticeXml=`<?xml version="1.0"?>
<PubmedArticleSet>
  <PubmedArticle>
    <MedlineCitation>
      <PMID>31347354</PMID>
      <Article>
        <ArticleTitle>Retraction of synthetic fixture</ArticleTitle>
        <PublicationTypeList>
          <PublicationType>Retraction Notice</PublicationType>
        </PublicationTypeList>
      </Article>
      <CommentsCorrectionsList>
        <CommentsCorrections RefType="RetractionOf">
          <RefSource>ACS Appl Mater Interfaces. 2012.</RefSource>
          <PMID>22489770</PMID>
        </CommentsCorrections>
      </CommentsCorrectionsList>
    </MedlineCitation>
    <PubmedData>
      <ArticleIdList>
        <ArticleId IdType="pubmed">31347354</ArticleId>
        <ArticleId IdType="doi">10.1021/acsami.9b11759</ArticleId>
      </ArticleIdList>
    </PubmedData>
  </PubmedArticle>
</PubmedArticleSet>`;

const originalRecord=parsePubmedXml(originalXml);
const noticeRecord=parsePubmedXml(noticeXml);

const animalXml=`<?xml version="1.0"?>
<PubmedArticleSet>
  <PubmedArticle>
    <MedlineCitation>
      <PMID>90000001</PMID>
      <Article>
        <ArticleTitle>Animal-only structured fixture</ArticleTitle>
        <PublicationTypeList>
          <PublicationType>Journal Article</PublicationType>
        </PublicationTypeList>
      </Article>
      <MeshHeadingList>
        <MeshHeading><DescriptorName>Animals</DescriptorName></MeshHeading>
        <MeshHeading><DescriptorName>Mice</DescriptorName></MeshHeading>
      </MeshHeadingList>
    </MedlineCitation>
    <PubmedData>
      <ArticleIdList>
        <ArticleId IdType="pubmed">90000001</ArticleId>
        <ArticleId IdType="doi">10.1000/animal-fixture</ArticleId>
      </ArticleIdList>
    </PubmedData>
  </PubmedArticle>
</PubmedArticleSet>`;

const laggedRctXml=`<?xml version="1.0"?>
<PubmedArticleSet><PubmedArticle><MedlineCitation>
<PMID>90000002</PMID><Article>
<ArticleTitle>A randomized controlled trial of a synthetic intervention</ArticleTitle>
<Abstract><AbstractText>We conducted a randomized controlled trial in 120 adults.</AbstractText></Abstract>
<PublicationTypeList><PublicationType>Journal Article</PublicationType></PublicationTypeList>
</Article><MeshHeadingList><MeshHeading><DescriptorName>Humans</DescriptorName></MeshHeading></MeshHeadingList>
</MedlineCitation><PubmedData><ArticleIdList><ArticleId IdType="pubmed">90000002</ArticleId></ArticleIdList></PubmedData>
</PubmedArticle></PubmedArticleSet>`;

const laggedPhase1Xml=`<?xml version="1.0"?>
<PubmedArticleSet><PubmedArticle><MedlineCitation>
<PMID>90000003</PMID><Article>
<ArticleTitle>A first-in-human phase 1 trial of a synthetic therapy</ArticleTitle>
<Abstract><AbstractText>This phase 1 study evaluated safety and tolerability in adults.</AbstractText></Abstract>
<PublicationTypeList><PublicationType>Journal Article</PublicationType></PublicationTypeList>
</Article><MeshHeadingList><MeshHeading><DescriptorName>Humans</DescriptorName></MeshHeading></MeshHeadingList>
</MedlineCitation><PubmedData><ArticleIdList><ArticleId IdType="pubmed">90000003</ArticleId></ArticleIdList></PubmedData>
</PubmedArticle></PubmedArticleSet>`;

const technologyXml=`<?xml version="1.0"?>
<PubmedArticleSet><PubmedArticle><MedlineCitation>
<PMID>90000004</PMID><Article>
<ArticleTitle>Deep learning benchmark for synthetic disease classification</ArticleTitle>
<Abstract><AbstractText>The classifier achieved 97 percent accuracy in benchmark evaluation.</AbstractText></Abstract>
<PublicationTypeList><PublicationType>Journal Article</PublicationType></PublicationTypeList>
</Article><MeshHeadingList>
<MeshHeading><DescriptorName>Deep Learning</DescriptorName></MeshHeading>
<MeshHeading><DescriptorName>Convolutional Neural Networks</DescriptorName></MeshHeading>
</MeshHeadingList>
</MedlineCitation><PubmedData><ArticleIdList><ArticleId IdType="pubmed">90000004</ArticleId></ArticleIdList></PubmedData>
</PubmedArticle></PubmedArticleSet>`;

const laggedRctRecord=parsePubmedXml(laggedRctXml);
const laggedPhase1Record=parsePubmedXml(laggedPhase1Xml);
const technologyRecord=parsePubmedXml(technologyXml);

if(laggedRctRecord?.study_stage!=="randomized_trial"||laggedRctRecord?.subject_scope!=="human"){
  throw new Error("PubMed explicit randomized fallback failed");
}
if(laggedPhase1Record?.study_stage!=="phase1"||laggedPhase1Record?.subject_scope!=="human"){
  throw new Error("PubMed explicit phase I fallback failed");
}
if(technologyRecord?.study_stage!=="technology_benchmark"||technologyRecord?.subject_scope!=="technology"){
  throw new Error("PubMed explicit technology benchmark fallback failed");
}

const animalRecord=parsePubmedXml(animalXml);
if(animalRecord?.study_stage!=="preclinical_animal"){
  throw new Error("PubMed animal-only MeSH mapping failed");
}
if(animalRecord?.independence_group!=="doi:10.1000/animal-fixture"){
  throw new Error("PubMed animal DOI canonicalization failed");
}


if(originalRecord?.publication_status!=="retracted"){
  throw new Error("PubMed retracted publication not detected");
}
if(originalRecord?.subject_scope!=="mixed"){
  throw new Error("PubMed mixed human-animal scope not preserved");
}
if(originalRecord?.study_stage!=="preclinical_animal"){
  throw new Error("PubMed mixed preclinical study stage not preserved");
}
if(originalRecord?.kind!=="paper"){
  throw new Error("retracted publication incorrectly classified as notice");
}
if(!originalRecord.integrity_relations.some(item=>
  item.direction==="updated_by"&&
  item.type==="retraction"&&
  item.external_id==="pmid:31347354"
)){
  throw new Error("PubMed RetractionIn relation missing");
}

if(noticeRecord?.publication_status!=="active"){
  throw new Error("PubMed retraction notice incorrectly marked retracted");
}
if(noticeRecord?.kind!=="retraction_notice"){
  throw new Error("PubMed Retraction Notice kind missing");
}
if(!noticeRecord.integrity_relations.some(item=>
  item.direction==="updates"&&
  item.type==="retraction"&&
  item.external_id==="pmid:22489770"
)){
  throw new Error("PubMed RetractionOf relation missing");
}

const original=adapterByProvider.pubmed(originalRecord);
const notice=adapterByProvider.pubmed(noticeRecord);

if(original.publication_status!=="retracted") throw new Error("PubMed adapter lost retracted status");
if(notice.source.kind!=="retraction_notice") throw new Error("PubMed adapter lost notice kind");
if(original.source.independence_group!=="doi:10.1021/am300292v") throw new Error("PubMed DOI independence canonicalization failed");
if(original.source.subject_scope!=="mixed") throw new Error("PubMed adapter lost mixed subject scope");
if(notice.source.independence_group!=="doi:10.1021/acsami.9b11759") throw new Error("PubMed notice DOI independence canonicalization failed");

const noticeDossier=buildDossier({
  id:"DOS-000301",
  candidate:{id:"CAND-000301"},
  resolution:{status:notice.status,provider:notice.provider,reason:notice.reason},
  source:notice.source,
  publication_status:notice.publication_status,
  integrity_relations:notice.integrity_relations,
  claimDrafts:[{
    text:"This PubMed record is a retraction notice.",
    claim_kind:"regulatory",
    subject_scope:"unknown",
    evidence:[{locator:"pubmed:publication-type",support:"context"}]
  }],
  contradictions:[],
  limitations:[],
  observed_at:"2099-01-01T00:00:00Z"
});

if(noticeDossier.safety.decision!=="investigate"){
  throw new Error("PubMed retraction notice bypassed integrity gate");
}

console.log("FE03_PUBMED_INTEGRITY_PASS|original_retracted=1|notice_active=1|relations_directional=1|doi_independence=1|animal_mesh_stage=1|mixed_scope=1|lagged_rct=1|lagged_phase1=1|technology_benchmark=1|notice_review_gate=1");
