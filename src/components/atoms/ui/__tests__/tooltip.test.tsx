import { describe, it, expect } from '@jest/globals';
import { render } from '@testing-library/react';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '../tooltip';
import { Button } from '../button';

describe('Tooltip', () => {
  it('should match snapshot', () => {
    const { container } = render(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button>Hover me</Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>This is a tooltip</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
    expect(container).toMatchSnapshot();
  });
});
