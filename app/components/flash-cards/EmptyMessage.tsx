import { Form } from 'react-router';
import Button from '../Button';

export default function EmptyMessage({ groupName }: { groupName: string }) {
  return (
    <section className='max-w-3xl mx-auto flex flex-col items-center bg-white p-4 my-16 shadow-md h-80 justify-center'>
      <h2 className='text-3xl font-semibold text-teal-900'>
        Flash cards for '{groupName}' are missing
      </h2>
      <p>Can you find them?</p>
      <Form action='edit'>
        <Button className='mt-4' size='sm' color='tealDark' type='submit'>
          Edit flash cards
        </Button>
      </Form>
    </section>
  );
}
