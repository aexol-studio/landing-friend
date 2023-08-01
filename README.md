# Landing Friend

import { ConfigFile } from "@landing-friend/core";

export const GLOBAL_CONFIG_FILE: ConfigFile = {
domain: "https://www.example.com",
input: "./out",
output: "./public",
analyzer: {
saveAs: "json",
tags: {
h1: {
minLength: 10,
maxLength: 70,
},
h2: {
minLength: 10,
maxLength: 70,
},
'name="description"': {
minLength: 50,
maxLength: 160,
},
title: {
minLength: 10,
maxLength: 70,
},
},
},
sitemap: {
locale: {
defaultLocale: "en",
localeWildcard: "/$locale/",
},
sortBy: "alphabetically-asc",
trailingSlash: true,
settingsPerWildcard: {
".png": {
exclude: true,
},
".mp4": {
exclude: true,
},
".gif": {
exclude: true,
},
"_/assets/_": {
exclude: true,
},
".git/": {
exclude: true,
},
\_next: {
exclude: true,
},
"_/images/_": {
exclude: true,
},
"_/locales/_": {
exclude: true,
},
"_/posts/_": {
priority: 1,
},
"_/app/_": {
exclude: true,
},
".json": {
exclude: true,
},
".ico": {
exclude: true,
},
".jpg": {
exclude: true,
},
},
},
};
