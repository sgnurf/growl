import { sampleNodeTypes } from '$lib/models/temp';
import { json } from '@sveltejs/kit';
import neo4j from 'neo4j-driver';
import { CreatedNode, UpsertNode, DeleteNode, CreateRelationship, UpdateRelationship, DeleteRelationship, ExecuteQuery } from '$lib/services/neo4jQueryExecutor';

const driver = neo4j.driver(
    'neo4j://localhost:7687'
)

export async function GET({ request, cookies }) {

    //let result = await CreatedNode("MyProjectId", "Project", "VCEIP", {name: "VolcoCE IP", description: "VCEIP is a project about VCEIP, trucks and stuff"});

    // await UpsertNode("MyProjectId", "Project", "VCEIP", {name: "VolcoCE IP", description: "VCEIP is a project about VCEIP, trucks and stuff"});
    // await UpsertNode("MyProjectId", "Project", "XGN", {name: "Xavier"});
    
    //let result = await DeleteNode("MyProjectId", "Project" ,"VCEIP");

    //let result = await CreateRelationship("MyProjectId", "KNOWS_ABOUT", "XGN", "VCEIP", {name: "a relation", description: "yes it is"});
    //let result = await UpdateRelationship(0, {tada: "test", description: "yes it is"});
    //let result = await DeleteRelationship(0);

    let result = await ExecuteQuery(`MATCH (n)
    OPTIONAL MATCH (n)-[r]->()
    RETURN n, r;`);
    
    return json(result);
    
}
