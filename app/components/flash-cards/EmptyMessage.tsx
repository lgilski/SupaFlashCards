import { Form } from 'react-router';

export default function EmptyMessage() {
  return (
    <section className='max-w-3xl mx-auto flex flex-col items-center bg-white p-4 my-16 shadow-md h-80 justify-center'>
      <h2 className='text-3xl font-semibold text-teal-900'>
        Flash cards are missing
      </h2>
      <p>Can you find them?</p>
      <Form action='edit'>
        <button
          className='font-medium text-teal-050 bg-teal-500 px-2 py-1 rounded-md cursor-pointer duration-150 hover:bg-teal-400 mt-4'
          type='submit'
        >
          Edit flash cards
        </button>
      </Form>
    </section>
  );
}
