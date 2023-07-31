# Landing Friend

import { ConfigFile } from "@landing-friend/core";

export const GLOBAL*CONFIG_FILE: ConfigFile = {
domain: "https://www.example.com",
input: "./out",
output: "./public",
analyzer: {
saveAs: "html",
tags: {
h1: {
minLength: 10,
maxLength: 70,
},
h2: {
minLength: 10,
maxLength: 70,
},
'meta name="description"': {
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
sortBy: "priority",
trailingSlash: true,
settingsPerWildcard: {
"\*/\_next/*": {
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
"\_/app/\_": {
exclude: true,
},
},
},
};
