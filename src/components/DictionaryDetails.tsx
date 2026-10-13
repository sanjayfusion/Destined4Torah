interface DictionaryDetailsProps {
  strongs: string
  definition: string
  book?: string
}

import { dictionarySourceUrl } from '../lib/dictionarySource'

export function DictionaryDetails({ strongs, definition, book }: DictionaryDetailsProps) {
  const insightUrl = book === 'Exodus' ? 'https://www.youtube.com/watch?v=aKjpOAXZnb4' : 'https://www.youtube.com/watch?v=4boXYeN7J58'
  const insightTitle = book === 'Exodus' ? 'Let there be Light in your Ark (Part 1)' : 'Let there be Light'
  const light = strongs === 'H216' || strongs === 'G5457'
  return <>
    <p className="study-label">Dictionary definition · Strong’s {strongs}</p>
    <p className="strongs-popover-def">{definition}</p>
    <p className="dictionary-source"><a href={dictionarySourceUrl(strongs)} target="_blank" rel="noopener noreferrer">Source: Strong’s dictionary via Open Scriptures</a> · <a href="/licenses/word-study-sources.txt" target="_blank" rel="noopener noreferrer">CC-BY-SA &amp; attribution</a></p>
    <p className="study-help">Possible dictionary match. The meaning in this verse depends on its grammar and context.</p>
    {light && <section className="teaching-insight" aria-label="Sanjay’s teaching insight">
      <p className="study-label">Sanjay’s teaching insight</p>
      <p>Sanjay connects the light in Genesis 1:3 with Yeshua, drawing on John 1:1–9 to invite believers into a deeper relationship with Him.</p>
      <a href={insightUrl} target="_blank" rel="noopener noreferrer">From “{insightTitle}”</a>
    </section>}
  </>
}
