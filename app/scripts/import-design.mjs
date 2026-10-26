import {readFileSync, writeFileSync, mkdirSync} from 'node:fs';
// Historical one-time importer, not a build step. Its old design snapshot
// replaces maintained onboarding code and the elephant asset. Restore only
// after deliberately reviewing those replacements and the current contracts.
if (process.argv.length !== 3 || process.argv[2] !== '--restore-historical-design') {
  throw new Error('Historical importer disabled. Maintain src/onboarding.ts and public/elephant.svg directly. A deliberate snapshot restoration requires --restore-historical-design.');
}
const source=readFileSync(new URL('../../design/app/onboarding/source.fragment.html',import.meta.url),'utf8');
const start=source.indexOf(' const questions=['), end=source.indexOf('\n ];',start)+4;
if(start<0 || end<start) throw new Error('Onboarding source changed; inspect before importing.');
const declaration=source.slice(start,end).replace(' const questions=', 'export const questions: Question[] =');
writeFileSync(new URL('../src/onboarding.ts',import.meta.url),
  '// Exact question/option copy imported from the established design. IDs match the profile contract.\n'+
  'export type Question = {id:string;title:string;optional?:boolean;multi?:boolean;exclusive?:string[];max?:number;kind?:string;options?:string[][]};\n'+declaration+'\n');
const elephant=source.match(/const ELEPHANT='data:image\/svg\+xml;base64,([^']+)'/);
if(!elephant) throw new Error('Approved elephant asset missing.');
mkdirSync(new URL('../public/',import.meta.url),{recursive:true});
writeFileSync(new URL('../public/elephant.svg',import.meta.url),Buffer.from(elephant[1],'base64'));
console.log('Imported the existing questions and original elephant asset.');
