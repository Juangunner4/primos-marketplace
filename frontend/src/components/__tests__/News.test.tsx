import React from 'react';
import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import News from '../News';
import i18n from '../../i18n';

jest.mock('@radix-ui/react-accordion', () => {
  const actual = jest.requireActual('@radix-ui/react-accordion');
  return {
    ...actual,
    Root: (props: any) => <div {...props} />,
    Item: (props: any) => <div {...props} />,
    Header: (props: any) => <div {...props} />,
    Trigger: (props: any) => <button {...props} />,
    Content: (props: any) => <div {...props} />,
  };
});

describe('News', () => {
  test('renders news items', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <News items={[{ id: '1', title: 'Test', body: 'Body' }]} />
      </I18nextProvider>
    );
    expect(screen.getByText(/Test/i)).toBeTruthy();
    expect(screen.getByText(/Body/i)).toBeTruthy();
  });
});
