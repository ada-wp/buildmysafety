import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import schema from '../../docs/contracts/user-profile-v0.schema.json';
import {emptyProfile, type Profile} from '../src/model';

const ajv = new Ajv2020({allErrors:true, strict:true});
addFormats(ajv);
export const validateProfile = ajv.compile<Profile>(schema);
const allowed = new Set(['answers','interests','personalizationEnabled','elephantName','revision']);
export function profileFromInput(input:unknown, userId:string, previous:Profile|null, now:string): Profile {
  if(!input || typeof input!=='object' || Array.isArray(input)) throw new Error('Invalid profile.');
  const fields=input as Record<string,unknown>;
  if(Object.keys(fields).some(key=>!allowed.has(key))) throw new Error('Unexpected profile fields.');
  const profile={...emptyProfile(userId), ...previous, ...fields, userId, schemaVersion:1,
    revision: previous ? previous.revision+1 : 1, updatedAt:now} as Profile;
  if(!validateProfile(profile)) throw new Error('Please check your selected answers.');
  if(profile.answers.country){
    const code=profile.answers.country;
    const name=new Intl.DisplayNames(['en'],{type:'region',fallback:'none'}).of(code);
    if(!name || ['EU','EZ','UN','QO','XA','XB','ZZ','UK','AC','CP','DG','EA','IC','TA'].includes(code)) throw new Error('Choose a supported country or keep it general.');
  }
  if(profile.elephantName!==null && !profile.elephantName.trim()) throw new Error('Enter a name or leave it blank.');
  return profile;
}
