import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import * as Accordion from '@radix-ui/react-accordion';
import { useTranslation } from 'react-i18next';

export interface NewsItem {
  id: string;
  title: string;
  body: string;
}

const sampleNews: NewsItem[] = [
  { id: '1', title: 'Marketplace Live', body: 'Weys marketplace is now live with trading and DAO tooling.' },
  { id: '2', title: 'DAO Update', body: 'Community votes on new treasury management strategies.' },
];

const News: React.FC<{ items?: NewsItem[] }> = ({ items }) => {
  const { t } = useTranslation();
  const news = items ?? sampleNews;
  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        {t('news')}
      </Typography>
      <Accordion.Root type="single" collapsible>
        {news.map((n) => (
          <Accordion.Item key={n.id} value={n.id}>
            <Accordion.Header>
              <Accordion.Trigger asChild>
                <Box
                  sx={{
                    background: '#181818',
                    color: '#fff',
                    px: 2,
                    py: 1,
                    mb: 1,
                    borderRadius: 1,
                    cursor: 'pointer',
                  }}
                >
                  {n.title}
                </Box>
              </Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Content>
              <Box sx={{ border: '1px solid #eee', p: 2, mb: 1 }}>
                <Typography variant="body2">{n.body}</Typography>
              </Box>
            </Accordion.Content>
          </Accordion.Item>
        ))}
      </Accordion.Root>
    </Box>
  );
};

export default News;
