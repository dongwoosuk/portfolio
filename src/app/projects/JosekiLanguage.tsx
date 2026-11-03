"use client";
import {createContext} from "react";
export const JosekiLanguage=createContext(false);
export function useJosekiText(){return (text:string)=>text;}
