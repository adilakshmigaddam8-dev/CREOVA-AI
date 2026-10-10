INSERT INTO app_profiles (user_id,role,display_name,headline,bio,location,organization,industry,skills,tools,categories,formats,languages,availability,commercial_use_declared,price_min,price_max,currency,public_profile)
SELECT 'demo-creator-01','creator','Mira Solanki','AI filmmaker · visual worlds','Builds cinematic product films and dreamlike campaign worlds with a documented production workflow. Demo profile for browsing; not an account.','Mumbai, India','','', '["AI filmmaking","storytelling","art direction"]'::jsonb,'["Runway","Midjourney","After Effects"]'::jsonb,'["AI filmmaking","advertising","motion graphics"]'::jsonb,'["16:9","9:16","1:1"]'::jsonb,'["English","Hindi"]'::jsonb,'open',true,900,2800,'USD',true
WHERE NOT EXISTS (SELECT 1 FROM app_profiles WHERE user_id='demo-creator-01');

INSERT INTO app_profiles (user_id,role,display_name,headline,bio,location,organization,industry,skills,tools,categories,formats,languages,availability,commercial_use_declared,price_min,price_max,currency,public_profile)
SELECT 'demo-creator-02','creator','Theo Laurent','Generative art direction · motion','Creates tactile editorial visuals for culture, beauty, and design-led launches. Demo profile; work and rights claims are illustrative only.','Paris, France','','', '["art direction","image generation","motion graphics"]'::jsonb,'["ComfyUI","Stable Diffusion","Blender"]'::jsonb,'["image generation","animation","advertising"]'::jsonb,'["4:5","1:1","9:16"]'::jsonb,'["English","French"]'::jsonb,'open',false,650,1900,'USD',true
WHERE NOT EXISTS (SELECT 1 FROM app_profiles WHERE user_id='demo-creator-02');

INSERT INTO app_profiles (user_id,role,display_name,headline,bio,location,organization,industry,skills,tools,categories,formats,languages,availability,commercial_use_declared,price_min,price_max,currency,public_profile)
SELECT 'demo-creator-03','creator','Anika Rao','AI animation · product storytelling','Turns product features into warm, character-driven animated stories for digital-first brands. Demo profile for discovery.','Bengaluru, India','','', '["animation","product storytelling","compositing"]'::jsonb,'["Runway","Blender","DaVinci Resolve"]'::jsonb,'["animation","AI filmmaking","advertising"]'::jsonb,'["16:9","9:16"]'::jsonb,'["English","Telugu","Hindi"]'::jsonb,'limited',true,1200,3500,'USD',true
WHERE NOT EXISTS (SELECT 1 FROM app_profiles WHERE user_id='demo-creator-03');

INSERT INTO app_profiles (user_id,role,display_name,organization,industry,location,public_profile)
SELECT 'demo-brand-01','brand','Studio Saffron','Studio Saffron','Fashion & lifestyle','Mumbai, India',true
WHERE NOT EXISTS (SELECT 1 FROM app_profiles WHERE user_id='demo-brand-01');

INSERT INTO app_profiles (user_id,role,display_name,organization,industry,location,public_profile)
SELECT 'demo-brand-02','brand','Still Form Studio','Still Form Studio','Home & design','Amsterdam, Netherlands',true
WHERE NOT EXISTS (SELECT 1 FROM app_profiles WHERE user_id='demo-brand-02');

INSERT INTO portfolio_items (creator_user_id,title,description,media_type,content_type,visual_style,tools,workflow,skills,formats,rights_status,license_notes,visibility)
SELECT 'demo-creator-01','Saffron Afterglow','Concept film exploring silk, light, and slow-motion product detail. Demonstration fixture; no independently verified rights claim.','image','AI filmmaking','Cinematic · tactile','["Runway","Midjourney"]'::jsonb,'["Moodboard","Shot design","Generation","Edit"]'::jsonb,'["storytelling","lighting"]'::jsonb,'["16:9","9:16"]'::jsonb,'self-reported','Demo fixture; usage rights require separate confirmation.','public'
WHERE NOT EXISTS (SELECT 1 FROM portfolio_items WHERE creator_user_id='demo-creator-01' AND title='Saffron Afterglow');

INSERT INTO portfolio_items (creator_user_id,title,description,media_type,content_type,visual_style,tools,workflow,skills,formats,rights_status,license_notes,visibility)
SELECT 'demo-creator-02','Objects in Bloom','Visual exploration of sculptural objects, soft shadows, and generative textures.','image','image generation','Editorial · sculptural','["ComfyUI","Blender"]'::jsonb,'["Reference study","Style tests","Compositing"]'::jsonb,'["art direction","image generation"]'::jsonb,'["4:5","1:1"]'::jsonb,'self-reported','Demo fixture; usage rights require separate confirmation.','public'
WHERE NOT EXISTS (SELECT 1 FROM portfolio_items WHERE creator_user_id='demo-creator-02' AND title='Objects in Bloom');

INSERT INTO portfolio_items (creator_user_id,title,description,media_type,content_type,visual_style,tools,workflow,skills,formats,rights_status,license_notes,visibility)
SELECT 'demo-creator-03','Little Worlds, Big Ideas','Stylized product story told through miniature scenes and gentle motion.','image','animation','Warm · playful · cinematic','["Runway","Blender"]'::jsonb,'["Script beats","Scene generation","Motion pass","Finishing"]'::jsonb,'["animation","compositing"]'::jsonb,'["16:9","9:16"]'::jsonb,'self-reported','Demo fixture; usage rights require separate confirmation.','public'
WHERE NOT EXISTS (SELECT 1 FROM portfolio_items WHERE creator_user_id='demo-creator-03' AND title='Little Worlds, Big Ideas');

INSERT INTO briefs (brand_user_id,title,objective,details,content_type,visual_style,required_skills,required_tools,deliverables,formats,aspect_ratios,duration,budget_min,budget_max,currency,deadline,commercial_use,channels,territories,usage_duration,exclusivity,licensing_requirements,status)
SELECT 'demo-brand-01','A Diwali Story in Light','Create a premium festive campaign that feels modern, cinematic, and rooted in craft.','Concept a short visual story for a premium apparel label. Final rights, likeness, music, and model terms must be confirmed before production.','AI filmmaking','Warm highlights, tactile fabric, cinematic pacing','["storytelling","AI filmmaking"]'::jsonb,'["Runway","Midjourney"]'::jsonb,'["1 hero film","3 cutdowns","5 stills"]'::jsonb,'["MP4","PNG"]'::jsonb,'["16:9","9:16","1:1"]'::jsonb,'15–30 seconds',1500,4000,'USD',(CURRENT_DATE + INTERVAL '21 days')::date,true,'["Instagram","Paid social"]'::jsonb,'India','6 months','Non-exclusive','Confirm commercial rights for every model/tool, music, and source asset.','published'
WHERE NOT EXISTS (SELECT 1 FROM briefs WHERE brand_user_id='demo-brand-01' AND title='A Diwali Story in Light');

INSERT INTO briefs (brand_user_id,title,objective,details,content_type,visual_style,required_skills,required_tools,deliverables,formats,aspect_ratios,duration,budget_min,budget_max,currency,deadline,commercial_use,channels,territories,usage_duration,exclusivity,licensing_requirements,status)
SELECT 'demo-brand-02','Objects for a Slower Morning','Create a series of stills and looping motion assets for a design-led home collection.','The look should feel editorial, calm, and materially believable. Document the generation workflow and any reference assets.','image generation','Soft daylight, mineral textures, quiet composition','["art direction","image generation"]'::jsonb,'["ComfyUI","Blender"]'::jsonb,'["8 campaign stills","2 loops"]'::jsonb,'["PNG","MP4"]'::jsonb,'["4:5","1:1"]'::jsonb,'5-second loops',800,2200,'USD',(CURRENT_DATE + INTERVAL '30 days')::date,false,'["Instagram","Website"]'::jsonb,'Global','12 months','Non-exclusive','Declare model/tool terms and any third-party reference restrictions.','published'
WHERE NOT EXISTS (SELECT 1 FROM briefs WHERE brand_user_id='demo-brand-02' AND title='Objects for a Slower Morning');