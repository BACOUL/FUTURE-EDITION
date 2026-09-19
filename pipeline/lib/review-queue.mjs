const priority={reject:0,investigate:1,hold:2,publish:3};

export function buildHumanReviewQueue(dossiers=[]){
  return dossiers
    .filter(d=>d?.safety?.human_review_required)
    .map(d=>({
      dossier_id:d.id,
      candidate_id:d.candidate_id,
      decision:d.safety.decision,
      confidence_ceiling:d.safety.confidence_ceiling,
      reasons:[...(d.safety.reasons||[])],
      publication_status:d.publication_status,
      source_external_id:d.source?.external_id??null
    }))
    .sort((a,b)=>
      (priority[a.decision]??9)-(priority[b.decision]??9)||
      a.dossier_id.localeCompare(b.dossier_id)
    );
}
