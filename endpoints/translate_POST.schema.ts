import {z} from "zod";
import superjson from "superjson";
export const schema=z.object({text:z.string().min(1).max(4000),source:z.string(),target:z.string()});
export type OutputType={translation:string;detected:string};
export async function postTranslate(input:z.infer<typeof schema>):Promise<OutputType>{
 const response=await fetch("/_api/translate",{method:"POST",headers:{"Content-Type":"application/json"},body:superjson.stringify(schema.parse(input))});
 const body=superjson.parse<any>(await response.text());
 if(!response.ok)throw new Error(body.error||"No se pudo traducir");
 return body as OutputType;
}
