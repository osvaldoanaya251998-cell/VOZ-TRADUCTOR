import {z} from "zod";
import superjson from "superjson";
export const schema=z.object({message:z.string().min(1).max(1500),language:z.string().max(12),level:z.enum(["A1","A2","B1","B2","C1","C2"]),topic:z.string().max(60),history:z.array(z.object({role:z.enum(["student","tutor"]),text:z.string().max(1000)})).max(12)});
export type OutputType={reply:string;correction:string;explanation:string;praise:string};
export async function postPractice(input:z.infer<typeof schema>):Promise<OutputType>{
 const response=await fetch("/_api/practice",{method:"POST",headers:{"Content-Type":"application/json"},body:superjson.stringify(schema.parse(input))});
 const result=superjson.parse<any>(await response.text());
 if(!response.ok)throw new Error(result.error||"No se pudo contactar al profesor");
 return result as OutputType;
}
