import { json } from '@sveltejs/kit';
import { ExecuteQuery } from '$lib/services/neo4jQueryExecutor';

export async function GET() {
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
