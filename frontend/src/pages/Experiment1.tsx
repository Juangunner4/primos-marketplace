import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { useTranslation } from 'react-i18next';
import './Experiment1.css';

const Experiment1: React.FC = () => {
  const { t } = useTranslation();
  const [file, setFile] = useState<File | null>(null);
  const [rendered, setRendered] = useState(false);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files ? e.target.files[0] : null);
  };

  const handleRender = async () => {
    if (!file) return;
    // Placeholder for Meshy.ai API integration
    setRendered(true);
  };

  return (
    <Box className="experiment-container">
      <Typography variant="h4" sx={{ mb: 2 }}>
        {t('experiment1_title')}
      </Typography>
      {!rendered ? (
        <>
          <Typography variant="body1" sx={{ mb: 2 }}>
            {t('experiment1_desc')}
          </Typography>
          <input type="file" accept="image/*" onChange={handleFile} data-testid="file-input" />
          <Button variant="contained" sx={{ mt: 2 }} disabled={!file} onClick={handleRender}>
            {t('experiment1_render')}
          </Button>
        </>
      ) : (
        <Box sx={{ mt: 3 }}>
          <iframe
            title="3D Preview"
            src="https://prod.spline.design/6i2dLHDXaxCefZ2v/scene.splinecode"
            className="experiment-iframe"
          />
        </Box>
      )}
    </Box>
  );
};

export default Experiment1;
