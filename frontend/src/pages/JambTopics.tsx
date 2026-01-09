import React from 'react';
import GenericHighSchoolTopicsPage from './GenericHighSchoolTopicsPage';

const JambTopics: React.FC = () => {
  return (
    <GenericHighSchoolTopicsPage 
      type="jamb" 
      sectionName="JAMB" 
      breadcrumbLabel="JAMB Subjects"
    />
  );
};

export default JambTopics;
