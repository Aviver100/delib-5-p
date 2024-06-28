import { Statement } from "delib-npm";
import { FC } from "react";
import { Section } from "./Section";
import "./InfoParser.scss";
import { getSectionObj } from "./InfoParserCont";

interface Props {
  statement: Statement;
}

const InfoParser: FC<Props> = ({ statement }) => {
  const section = getSectionObj(statement.statement, 0);
  console.log(section);

  if (!section) return null;

  return (
    <Section
      title={section.title}
      level={section.level}
      paragraphs={section.paragraphs}
      sections={section.sections}
    />
  );

  // return <Section sectionText={statement.statement} parentLevel={0} />;
};

export default InfoParser;

export function switchHeaders(text: string, level: number) {
  switch (level) {
    case 1:
      return <h1>{text}</h1>;
    case 2:
      return <h2>{text} </h2>;
    case 3:
      return <h3>{text} </h3>;
    case 4:
      return <h4>{text} </h4>;
    case 5:
      return <h5>{text} </h5>;
    case 6:
      return <h6>{text} </h6>;
    default:
      return <p>{text} </p>;
  }
}
