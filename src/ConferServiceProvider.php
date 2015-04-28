<?php

namespace DJB\Confer;

use Illuminate\Support\ServiceProvider;
use Illuminate\Foundation\AliasLoader;

use \Pusher;
use View;

class ConferServiceProvider extends ServiceProvider
{

    /**
     * Indicates if loading of the provider is deferred.
     *
     * @var bool
     */
    protected $defer = false;

    /**
     * Register the service provider.
     *
     * @return void
     */
    public function register()
    {
        $this->app->bindShared('push', function($app) {
            $keys = $app['config']->get('services.pusher');
            return new Pusher($keys['public'], $keys['secret'], $keys['app_id']);
        });
        AliasLoader::getInstance()->alias('Push', 'DJB\Confer\Facades\Push');
        View::composer('confer::confer', 'DJB\Confer\Http\ViewComposers\ConferComposer');
        View::composer('confer::barconversationlist', 'DJB\Confer\Http\ViewComposers\ConferBarComposer');
    }

    /**
     * Bootstrap the application events.
     *
     * @return void
     */
    public function boot()
    {
        //if ($this->app->runningInConsole()) return false;
        include __DIR__ . '/Http/routes.php';

        $this->loadViewsFrom(__DIR__ . '/views', 'confer');

        $this->publishes([
        	__DIR__ . '/views' => base_path('resources/views/vendor/confer'),
            __DIR__ . '/database/migrations/' => database_path('/migrations'),
            __DIR__ . '/database/seeds/' => database_path('/seeds'),
        	__DIR__ . '/config/confer.php' => config_path('confer.php'),
        	__DIR__ . '/assets/' => public_path('vendor/confer'),
        ]);

        $this->publishes([
            __DIR__ . '/database/migrations/' => database_path('/migrations')
        ], 'migrations');

        $this->publishes([
            __DIR__ . '/database/seeds/' => database_path('/seeds')
        ], 'seeds');

        $this->publishes([
        	__DIR__ . '/views' => base_path('resources/views/vendor/confer'),
        ], 'views');

        $this->publishes([
            __DIR__ . '/assets/' => public_path('vendor/confer'),
        ], 'public');

        $this->publishes([
        	__DIR__ . '/config/confer.php' => config_path('confer.php'),
        ], 'config');
    }

}