import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import type {Database, Statement, SqlValue} from '../server/database';
type LocalStatement = Statement & {runSync():{meta:{changes:number}}};
export class SqliteDatabase implements Database {
  readonly connection:DatabaseSync;
  constructor(path=':memory:'){
    this.connection=new DatabaseSync(path);
    this.connection.exec(readFileSync(new URL('../server/schema.sql',import.meta.url),'utf8'));
  }
  prepare(sql:string):Statement {
    const db=this.connection;
    const create=(params:SqlValue[]):LocalStatement=>({
      bind:(...values)=>create(values),
      first:async<T>()=>(db.prepare(sql).get(...params)||null) as T|null,
      all:async<T>()=>({results:db.prepare(sql).all(...params) as T[]}),
      run:async()=>({meta:{changes:Number(db.prepare(sql).run(...params).changes)}}),
      runSync:()=>({meta:{changes:Number(db.prepare(sql).run(...params).changes)}})
    });return create([]);
  }
  async batch(statements:Statement[]){
    this.connection.exec('BEGIN IMMEDIATE');
    try {const results=statements.map(statement=>(statement as LocalStatement).runSync());this.connection.exec('COMMIT');return results;}
    catch(error){this.connection.exec('ROLLBACK');throw error;}
  }
  close(){this.connection.close();}
}
