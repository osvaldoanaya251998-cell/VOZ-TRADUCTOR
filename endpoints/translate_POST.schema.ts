import {z} from "zod";
import {translateInBrowser} from "../helpers/browserTranslation";
export const schema=z.object({text:z.string().min(1).max(4000),source:z.string(),target:z.string()});
export type OutputType={translation:string;detected:string};
export async function postTranslate(input:z.infer<typeof schema>):Promise<OutputType>{
 const data=schema.parse(input);
 const translation=await translateInBrowser(data.text,data.source,data.target);
 return {translation,detected:data.source};
}
