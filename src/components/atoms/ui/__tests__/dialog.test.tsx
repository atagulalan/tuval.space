import { describe, it, expect } from '@jest/globals';
import { render } from '@testing-library/react';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from '../dialog';
import { Button } from '../button';

describe('Dialog', () => {
  it('should match snapshot when closed', () => {
    const { container } = render(
      <Dialog open={false}>
        <DialogTrigger asChild>
          <Button>Open</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Title</DialogTitle>
            <DialogDescription>Description</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
    expect(container).toMatchSnapshot();
  });

  it('should match snapshot when open', () => {
    const { container } = render(
      <Dialog open={true}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Open Dialog</DialogTitle>
            <DialogDescription>This dialog is open</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button>OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
    expect(container).toMatchSnapshot();
  });
});
