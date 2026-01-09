import React from 'react';
import GenericHighSchoolTopicsPage from './GenericHighSchoolTopicsPage';

const WaecTopics: React.FC = () => {
  return (
    <GenericHighSchoolTopicsPage 
      type="waec" 
      sectionName="WAEC" 
      breadcrumbLabel="WAEC Subjects"
    />
  );
};

export default WaecTopics;
