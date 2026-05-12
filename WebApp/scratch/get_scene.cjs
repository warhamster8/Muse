
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function getScene() {
  // Since we don't have auth, we hope RLS is either disabled for this specific query 
  // or we can find a way. But wait, if RLS is on, this will fail.
  // Let's try anyway.
  
  const { data: projects, error: pError } = await supabase
    .from('projects')
    .select('*')
    .ilike('title', '%450 milioni%');

  if (pError) {
    console.error('Error fetching projects:', pError);
    return;
  }

  if (!projects || projects.length === 0) {
    console.log('Project not found');
    return;
  }

  const project = projects[0];
  console.log('Found project:', project.title, project.id);

  const { data: chapters, error: cError } = await supabase
    .from('chapters')
    .select('*')
    .eq('project_id', project.id)
    .ilike('title', '%Capitolo 1%');

  if (cError || !chapters || chapters.length === 0) {
    console.log('Chapter not found');
    return;
  }

  const chapter = chapters[0];
  console.log('Found chapter:', chapter.title, chapter.id);

  const { data: scenes, error: sError } = await supabase
    .from('scenes')
    .select('*')
    .eq('chapter_id', chapter.id)
    .ilike('title', '%Impatto%');

  if (sError || !scenes || scenes.length === 0) {
    console.log('Scene not found');
    return;
  }

  const scene = scenes[0];
  console.log('--- SCENE CONTENT START ---');
  console.log(scene.content);
  console.log('--- SCENE CONTENT END ---');
}

getScene();
