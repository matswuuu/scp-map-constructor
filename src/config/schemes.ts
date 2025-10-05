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
    .sort((o1, o2) => o1[0].localeCompare(o2[0]))
    .map(([key, value]) => deserializeScheme(key, value));

export default defaultSchemes;