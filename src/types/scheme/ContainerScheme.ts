import {Scheme} from "./Scheme.ts";
import {metadata} from "../../decorators/metadata.decorator.ts";

export class ContainerScheme extends Scheme {

    @metadata()
    accessLevel: number;

}