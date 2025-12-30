import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function updateSlide() {
  const slideId = '1f01e314-31ff-498d-aa72-6acefd0b6982';
  
  // First check current type
  const { data: current, error: selectError } = await supabase
    .from('slides')
    .select('type, props_json')
    .eq('id', slideId)
    .single();
    
  if (selectError) {
    console.error('Error fetching slide:', selectError);
    return;
  }
  
  console.log('Current slide type:', current.type);
  console.log('Current props:', current.props_json);
  
  // Update to lesson-end if not already
  if (current.type !== 'lesson-end') {
    const { error: updateError } = await supabase
      .from('slides')
      .update({ 
        type: 'lesson-end',
        props_json: {
          title: 'Lesson Complete!',
          message: 'Congratulations! You have successfully completed this lesson. Great job on your progress!'
        }
      })
      .eq('id', slideId);
      
    if (updateError) {
      console.error('Error updating slide:', updateError);
    } else {
      console.log('Slide updated to lesson-end type');
    }
  } else {
    console.log('Slide is already lesson-end type');
  }
}

updateSlide().catch(console.error);
