import { Skeleton } from '~shared/ui/skeleton/skeleton.ui';
import { Stack } from '~shared/ui/stack/stack.ui';

export function TagFilterSkeleton() {
  return (
    <Stack spacing={4}>
      {new Array(10).fill(0).map((_, idx) => (
        <Skeleton key={idx} variant="rounded" width={45} />
      ))}
    </Stack>
  );
}
