import { describe, it, expect } from '@jest/globals';
import { render } from '@testing-library/react';
import { ModificationHistoryToggle } from './ModificationHistoryToggle';

describe('ModificationHistoryToggle', () => {
  it('should match snapshot when closed', () => {
    const { container } = render(
      <ModificationHistoryToggle isOpen={false} onChange={() => {}} />
    );
    expect(container).toMatchSnapshot();
  });

  it('should match snapshot when open', () => {
    const { container } = render(
      <ModificationHistoryToggle isOpen={true} onChange={() => {}} />
    );
    expect(container).toMatchSnapshot();
  });

  it('should match snapshot with count', () => {
    const { container } = render(
      <ModificationHistoryToggle
        isOpen={false}
        onChange={() => {}}
        modificationCount={5}
      />
    );
    expect(container).toMatchSnapshot();
  });

  it('should match snapshot with high count', () => {
    const { container } = render(
      <ModificationHistoryToggle
        isOpen={false}
        onChange={() => {}}
        modificationCount={150}
      />
    );
    expect(container).toMatchSnapshot();
  });
});
