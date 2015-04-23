<h1>
<a id="user-content-confer" class="anchor" href="#confer" aria-hidden="true"><span class="octicon octicon-link"></span></a>Confer</h1>

<p>Add a real-time chat system to your laravel 5 website/application in a few lines of code</p>

<p>Recently I have had a few projects that have required a chat feature, and I wanted to create a laravel package - so here it is!</p>

<h1>
<a id="user-content-requirements" class="anchor" href="#requirements" aria-hidden="true"><span class="octicon octicon-link"></span></a>Requirements</h1>

<p>The project currently requires Pusher (php-server and javascript) to allow real-time chat messaging. I really recommend this service if you need to do anything real-time - it's fast, reliable and very easy to implement in your projects.
You can create a free sandbox account at <a href="https://www.pusher.com">pusher.com</a> which lets you have 100,000 messages a day and 20 active users at one time. If you need higher limits they offer paid accounts at pretty decent prices.</p>

<p>Other requirements:</p>

<ul class="task-list">
<li>moment.js (it made me sad to have to require this, but it makes updating the chat timestamps so much easier)</li>
<li>jQuery</li>
</ul>

<h1>
<a id="user-content-installation" class="anchor" href="#installation" aria-hidden="true"><span class="octicon octicon-link"></span></a>Installation</h1>

<p>Require the package via composer:
<code>composer require djb/confer</code></p>

<p>Publish the assets:
<code>php artisan vendor:publish</code></p>

<p>Add the seed to your database seed caller (default is <code>database\seeds\DatabaseSeeder.php</code>):</p>

<div class="highlight highlight-php"><pre><span class="pl-s1"><span class="pl-k">class</span> <span class="pl-en">DatabaseSeeder</span> <span class="pl-k">extends</span> <span class="pl-e">Seeder</span> {</span>
<span class="pl-s1"></span>
<span class="pl-s1"><span class="pl-c">/**</span></span>
<span class="pl-s1"><span class="pl-c"> * Run the database seeds.</span></span>
<span class="pl-s1"><span class="pl-c"> *</span></span>
<span class="pl-s1"><span class="pl-c"> * <span class="pl-k">@return</span> void</span></span>
<span class="pl-s1"><span class="pl-c"> */</span></span>
<span class="pl-s1"><span class="pl-k">public</span> <span class="pl-k">function</span> <span class="pl-en">run</span>()</span>
<span class="pl-s1">{</span>
<span class="pl-s1">  <span class="pl-c1">Model</span><span class="pl-k">::</span>unguard();</span>
<span class="pl-s1"></span>
<span class="pl-s1">  <span class="pl-smi">$this</span><span class="pl-k">-&gt;</span>call(<span class="pl-s"><span class="pl-pds">'</span>ConferSeeder<span class="pl-pds">'</span></span>);</span>
<span class="pl-s1">}</span></pre></div>

<p>Migrate your database with the seeds in tow:
<code>php artisan migrate --seed</code></p>

<p>Add the viewcomposers to your existing <code>ComposerServiceProvider.php</code> or create one (there is a great guide you can follow on laravel's website <a href="http://laravel.com/docs/5.0/views#view-composers">here</a>):</p>

<div class="highlight highlight-php"><pre><span class="pl-s1"><span class="pl-k">class</span> <span class="pl-en">ComposerServiceProvider</span> <span class="pl-k">extends</span> <span class="pl-e">ServiceProvider</span> {</span>
<span class="pl-s1"></span>
<span class="pl-s1"><span class="pl-c">/**</span></span>
<span class="pl-s1"><span class="pl-c">* Register bindings in the container.</span></span>
<span class="pl-s1"><span class="pl-c">*</span></span>
<span class="pl-s1"><span class="pl-c">* <span class="pl-k">@return</span> void</span></span>
<span class="pl-s1"><span class="pl-c">*/</span></span>
<span class="pl-s1"><span class="pl-k">public</span> <span class="pl-k">function</span> <span class="pl-en">boot</span>()</span>
<span class="pl-s1">{</span>
<span class="pl-s1">  <span class="pl-c1">View</span><span class="pl-k">::</span>composer(<span class="pl-s"><span class="pl-pds">'</span>confer::confer<span class="pl-pds">'</span></span>, <span class="pl-s"><span class="pl-pds">'</span>DJB\Confer\Http\ViewComposers\ConferComposer<span class="pl-pds">'</span></span>);</span>
<span class="pl-s1">  <span class="pl-c1">View</span><span class="pl-k">::</span>composer(<span class="pl-s"><span class="pl-pds">'</span>confer::barconversationlist<span class="pl-pds">'</span></span>, <span class="pl-s"><span class="pl-pds">'</span>DJB\Confer\Http\ViewComposers\ConferBarComposer<span class="pl-pds">'</span></span>); (<span class="pl-c1">optional</span>)</span>
<span class="pl-s1">}</span></pre></div>

<p>Add the trait to your User model:</p>

<div class="highlight highlight-php"><pre><span class="pl-s1"><span class="pl-k">use</span> <span class="pl-c1">DJB\Confer\Traits\CanConfer</span>;</span>
<span class="pl-s1"></span>
<span class="pl-s1"><span class="pl-k">class</span> <span class="pl-en">User</span> <span class="pl-k">extends</span> <span class="pl-e">Model</span> {</span>
<span class="pl-s1"></span>
<span class="pl-s1">  <span class="pl-k">use</span> <span class="pl-c1">CanConfer</span>;</span>
<span class="pl-s1"></span>
<span class="pl-s1">}</span></pre></div>

<p>Link to the css file, and import the view partials in whichever pages you wish to have the chat on, or put it in your app/master file (if you are using one) to show on all pages:</p>

<div class="highlight highlight-html"><pre>&lt;<span class="pl-ent">link</span> <span class="pl-e">href</span>=<span class="pl-s"><span class="pl-pds">"</span>/vendor/confer/css/confer.css<span class="pl-pds">"</span></span> <span class="pl-e">rel</span>=<span class="pl-s"><span class="pl-pds">"</span>stylesheet<span class="pl-pds">"</span></span>&gt;
@include('confer::confer')

&lt;<span class="pl-ent">script</span> <span class="pl-e">src</span>=<span class="pl-s"><span class="pl-pds">"</span>/js/pusher.min.js<span class="pl-pds">"</span></span>&gt;&lt;/<span class="pl-ent">script</span>&gt;
&lt;<span class="pl-ent">script</span> <span class="pl-e">src</span>=<span class="pl-s"><span class="pl-pds">"</span>/js/moment.min.js<span class="pl-pds">"</span></span>&gt;&lt;/<span class="pl-ent">script</span>&gt;
@include('confer::js')</pre></div>

<h1>
<a id="user-content-configuration" class="anchor" href="#configuration" aria-hidden="true"><span class="octicon octicon-link"></span></a>Configuration</h1>

<p>There are a number of options in the confer.php config file which are quite self explanatory, but in short you can:</p>

<ul class="task-list">
<li>Provide a company avatar (this is the image that will show as your global chat icon should you...)</li>
<li>Allow global chat - have a free-for-all open chat, or don't... it's up to you</li>
<li>Specify a different loader to the one used (default is a sweet looking .svg by <a href="http://samherbert.net/svg-loaders/">Sam Herbert</a>)</li>
<li>Change the directory where avatars are stored</li>
<li>Enable some serious grammar enforcing (currently capitals at start of sentences, and refusal to allow the use of numbers between 0-9 without converting them to their word format)</li>
</ul>

<p>The avatar, loader and company avatar are all relative to your apps /public dir</p>

<p>Your Pusher app details are not configured in the config file provided, they are instead expected to be provided in your <code>config\services.php</code> file in the format:</p>

<pre><code>'pusher' =&gt; [
        'public' =&gt; 'public_key',
        'secret' =&gt; 'secret_key',
        'app_id' =&gt; 'app_id'
    ],
</code></pre>

<h1>
<a id="user-content-assumptions-of-the-package" class="anchor" href="#assumptions-of-the-package" aria-hidden="true"><span class="octicon octicon-link"></span></a>Assumptions of the package</h1>

<p>The package assumes you have a User model in the App namespace, and that this model has a <code>name</code> attribute (hey, if you don't have one already, why not create one with a custom getter?) and an <code>avatar</code> attribute - which is simply the filename of the avatar image file (for example <code>avatar-dan.jpg</code>) which will be appended to your avatar_dir provided in the config file of the package to find your avatar.</p>

<h1>
<a id="user-content-potential-updates" class="anchor" href="#potential-updates" aria-hidden="true"><span class="octicon octicon-link"></span></a>Potential updates</h1>

<p>Likely updates include adding mentions, sounds and changing conversation names after the initial setup.</p>

<p>What would you like to see?</p>

<h1>
<a id="user-content-closing" class="anchor" href="#closing" aria-hidden="true"><span class="octicon octicon-link"></span></a>Closing</h1>

<p>If you use this package in your project it would mean the absolute world to me if you let me know! This is my first package, and my first piece of code shared so really... it's close to me.
That said please feel free to contribute to the project - I think it has a solid foundation for expansion.</p>
