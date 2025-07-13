import configData from './blocks.json';
import type {Scheme} from "../types/scheme/Scheme.ts";
import {deserializeScheme} from "../types/scheme/SchemeDeserializer.ts";

const defaultSchemes: Scheme[] = Object.entries(configData)
    .map(([key, value]) => deserializeScheme(key, value));

export default defaultSchemes;