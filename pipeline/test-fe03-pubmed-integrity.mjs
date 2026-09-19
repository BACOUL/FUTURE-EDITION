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

if(originalRecord?.publication_status!=="retracted"){
  throw new Error("PubMed retracted publication not detected");
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

console.log("FE03_PUBMED_INTEGRITY_PASS|original_retracted=1|notice_active=1|relations_directional=1|doi_independence=1|notice_review_gate=1");
