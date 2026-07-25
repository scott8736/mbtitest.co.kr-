import GenericTestRunner from "../../../components/GenericTestRunner";
import { genericTests } from "../../../lib/generic-tests";
export default function Page(){return <GenericTestRunner test={genericTests["love-language"]}/>;}
