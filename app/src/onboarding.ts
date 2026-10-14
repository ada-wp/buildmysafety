// Exact question/option copy imported from the established design. IDs match the profile contract.
export type Question = {id:string;title:string;optional?:boolean;multi?:boolean;exclusive?:string[];max?:number;kind?:string;options?:string[][]};
export const questions: Question[] =[
  {id:'why',title:'What brought you here today?',options:[['ease','I’d like to feel more at ease on my own.'],['trust','I want to trust myself a little more.'],['change','Something in my life is changing.'],['unprepared','Something recently left me feeling unprepared.'],['curious','I’m just curious.']]},
  {id:'home',title:'What does home look like for you right now?',optional:true,options:[['alone','I live on my own.'],['preparing','I’m preparing to live on my own.'],['sometimes','I’m on my own some of the time.'],['shared','I share my home.'],['private','I’d rather skip this.']]},
  {id:'focus',title:'When would you most like to feel, “I can handle this”?',options:[['sick','When I’m unwell and need to rest.'],['home','When something unexpected happens at home.'],['daily','When everyday responsibilities pile up.'],['people','When I need to reach out for help.'],['peace','When I feel unsettled or overwhelmed.'],['change','During a change in my life.'],['unsure','I’m still figuring that out.']]},
  {id:'difficulty',title:'What makes that feel difficult?',multi:true,options:[['uncertain','I’m unsure what I would do.'],['alone','It feels like everything depends on me.'],['support','I don’t know who I could turn to.'],['judgment','I find it hard to trust my own judgment.'],['too_much','It feels like too much to think about.'],['other','Something else.']]},
  {id:'feeling',title:'How does this feel for you lately?',optional:true,options:[['okay','Mostly okay—I’m thinking ahead.'],['uncertain','A little uncertain.'],['on_mind','It’s been on my mind.'],['overwhelmed','Overwhelming.'],['private','I’d rather skip this.']]},
  {id:'constraints',title:'What might make it hard to take a first step?',multi:true,exclusive:['none'],options:[['energy','My energy is low.'],['time','My days already feel full.'],['cost','I need to keep costs down.'],['support','I have limited support nearby.'],['start','I don’t know where to begin.'],['none','Nothing in particular.']]},
  {id:'strengths',title:'What already helps you find your footing?',multi:true,exclusive:['discovering'],options:[['person','Someone I trust.'],['routine','Familiar routines.'],['prepared','Things I’ve already put in place.'],['experience','Remembering what I’ve handled before.'],['learning','Learning something useful.'],['discovering','I’m still discovering what helps.']]},
  {id:'hope',title:'What would a stronger sense of safety feel like for you?',multi:true,max:2,options:[['start','“I trust myself to take care of me.”'],['prepared','“I have things in place that help me feel more prepared.”'],['support','“I know where to turn—I don’t have to handle everything alone.”'],['trust','“When life feels uncertain, I can find my footing.”'],['choice','“I feel freer to enjoy life on my own.”']]},
  {id:'style',title:'How would you like us to help you begin?',options:[['one','Suggest one gentle first step.'],['choice','Give me a few ideas to choose from.'],['understand','Help me understand my options.'],['resources','Show me useful tools and resources.']]},
  {id:'note',title:'Anything else you’d like us to understand?',kind:'text',optional:true}
 ];

// A returning draft may still point at the removed country question.
export function questionStep(id: string) {
  return Math.max(0, questions.findIndex(question => question.id === (id === 'country' ? 'note' : id)));
}
