import configData from './schemes.json';
import {Scheme} from "../types/Scheme.ts";

function deserializeScheme(id: string, data: any): Scheme {
    const metadataFields = data.metadataFields as string[];
    return new Scheme(
        id,
        data.type,
        data.pivot,
        data.color,
        data.anchors,
        data.occupiedBlocks,
        data.allowIntersection,
        new Map<string, any>(
            metadataFields.map(key => [key, undefined])
        )
    )
}

const defaultSchemes: Scheme[] = Object.entries(configData)
    .map(([key, value]) => deserializeScheme(key, value));

export default defaultSchemes;