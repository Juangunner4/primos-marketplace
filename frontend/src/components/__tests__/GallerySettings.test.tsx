import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import GallerySettings from '../GallerySettings';
import i18n from '../../i18n';

const noop = () => {};

describe('GallerySettings', () => {
  test('calls onViewChange when selecting view', () => {
    const onViewChange = jest.fn();
    render(
      <I18nextProvider i18n={i18n}>
        <GallerySettings
          minPrice=""
          maxPrice=""
          minRank=""
          maxRank=""
          attributeGroups={{}}
          selectedAttributes={{}}
          setSelectedAttributes={noop}
          setMinPrice={noop}
          setMaxPrice={noop}
          setMinRank={noop}
          setMaxRank={noop}
          onClearFilters={noop}
          onApplyFilters={noop}
          view="grid9"
          onViewChange={onViewChange}
        />
      </I18nextProvider>
    );
    fireEvent.click(screen.getByLabelText('4 Cards'));
    expect(onViewChange).toHaveBeenCalledWith('grid4');
  });
});
