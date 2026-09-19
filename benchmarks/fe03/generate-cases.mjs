const SCENARIOS=[
  ["valid_rct","resolved","paper","randomized_trial","active","publish","solid_preliminary"],
  ["valid_systematic","resolved","paper","systematic_review","active","publish","solid_preliminary"],
  ["regulatory","resolved","regulator","regulatory_approval","active","publish","solid_preliminary"],
  ["real_world","resolved","technical_report","real_world_deployment","active","publish","solid_preliminary"],
  ["preprint","resolved","preprint","randomized_trial","active","hold","needs_confirmation"],
  ["animal","resolved","paper","preclinical_animal","active","hold","needs_confirmation"],
  ["phase1","resolved","paper","phase1","active","hold","needs_confirmation"],
  ["retracted","resolved","paper","randomized_trial","retracted","reject","unverifiable"],
  ["concern","resolved","paper","randomized_trial","expression_of_concern","investigate","solid_preliminary"],
  ["invalid_id","invalid","other","unknown","unresolved","reject","unverifiable"],
  ["unresolved","unresolved","other","unknown","unresolved","investigate","unverifiable"],
  ["contradiction","resolved","paper","randomized_trial","active","investigate","solid_preliminary"]
];

const splitOf=i=>i<120?"dev":i<180?"validation":"holdout";
const cases=[];

for(let i=0;i<240;i++){
  const s=SCENARIOS[i%SCENARIOS.length];
  cases.push({
    id:"FE03-B-"+String(i+1).padStart(4,"0"),
    split:splitOf(i),
    scenario:s[0],
    resolution_status:s[1],
    source_kind:s[2],
    study_stage:s[3],
    publication_status:s[4],
    has_locator:!["invalid_id","unresolved"].includes(s[0]),
    peer_reviewed:!["preprint","invalid_id","unresolved"].includes(s[0]),
    contradiction:s[0]==="contradiction",
    expected_decision:s[5],
    expected_confidence_ceiling:s[6],
    must_not_confirm:true
  });
}

process.stdout.write(JSON.stringify(cases,null,2)+"\n");
