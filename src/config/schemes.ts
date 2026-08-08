import {Scheme} from "../types/Scheme.ts";

export const SCHEMES_URL = "./schemes/jungled-complex.json";

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

export async function loadSchemes(): Promise<Scheme[]> {
    const response = await fetch(SCHEMES_URL);
    if (!response.ok) {
        throw new Error(`Failed to load schemes: ${response.status} ${response.statusText}`);
    }
    const configData = await response.json();
    return Object.entries(configData)
        .sort((o1, o2) => o1[0].localeCompare(o2[0]))
        .map(([key, value]) => deserializeScheme(key, value));
}
